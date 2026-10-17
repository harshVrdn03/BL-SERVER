import { AppError } from '../core/AppError.js'
import { Logger } from '../core/Logger.js'
import { env } from '../config/env.js'
import type { AuthContext } from '../types/domain.js'
import type { TicketDTO, TicketMessageDTO } from '../types/api.js'
import { BookRepository } from '../repositories/BookRepository.js'
import { AIService } from './AIService.js'
import { MessageRepository } from '../repositories/MessageRepository.js'
import { TicketRepository } from '../repositories/TicketRepository.js'
import type { CreateTicketInput } from '../schemas/ticket.schemas.js'
import { TICKET_STATUS } from '../enums/ticketEnums.js'
import { socketIOService } from '../core/SocketIO.js'

export class TicketService {
  private readonly tickets: TicketRepository
  private readonly messages: MessageRepository
  private readonly books: BookRepository
  private readonly ai: AIService
  private readonly logger: Logger

  constructor() {
    this.tickets = new TicketRepository()
    this.messages = new MessageRepository()
    this.books = new BookRepository()
    this.ai = new AIService()
    this.logger = new Logger(env.LOG_LEVEL).child('tickets')
  }

  private requireAuthor(auth: AuthContext | undefined): string {
    if (!auth) throw AppError.unauthorized()
    if (auth.role !== 'author' || !auth.authorId) {
      throw AppError.forbidden('Only authors can access this resource')
    }
    return auth.authorId
  }

  async createTicket(auth: AuthContext | undefined, input: CreateTicketInput): Promise<TicketDTO> {
    const authorId = this.requireAuthor(auth)

    if (input.bookId) {
      const book = await this.books.findByIdForAuthor(input.bookId, authorId)
      if (!book) throw AppError.badRequest('Selected book could not be found on your account')
    }

    let ticket = await this.tickets.create({
      authorId,
      bookId: input.bookId,
      subject: input.subject,
      description: input.description,
      attachmentUrl: input.attachmentUrl,
    })

    void this.classifyTicket(ticket.id).catch((error) => {
      this.logger.warn('Background classification failed', {
        ticketId: ticket.id,
        error: error instanceof Error ? error.message : String(error),
      })
    })

    socketIOService.emit('created', {
      ticketId: ticket.id,
      authorId,
      status: ticket.status,
      at: new Date().toISOString(),
    })

    return ticket
  }

  private async classifyTicket(ticketId: string): Promise<void> {
    const ticket = await this.tickets.findById(ticketId)
    if (!ticket) return

    try {
      const result = await this.ai.classify({
        subject: ticket.subject,
        description: ticket.description,
        bookTitle: ticket.bookTitle,
      })

      if (this.ai.isEnabled) {
        await this.tickets.applyAiResult(ticketId, {
          category: result.category,
          priority: result.priority,
        })
      } else {
        await this.tickets.applyDefaultClassification(ticketId)
      }

      socketIOService.emit('updated', {
        ticketId,
        authorId: ticket.authorId,
        status: ticket.status,
        at: new Date().toISOString(),
      })
    } catch {
      await this.tickets.applyDefaultClassification(ticketId)
      socketIOService.emit('updated', {
        ticketId,
        authorId: ticket.authorId,
        status: ticket.status,
        at: new Date().toISOString(),
      })
    }
  }

  async listMine(auth: AuthContext | undefined): Promise<TicketDTO[]> {
    const authorId = this.requireAuthor(auth)
    return this.tickets.listByAuthor(authorId)
  }

  async getMine(auth: AuthContext | undefined, ticketId: string): Promise<TicketDTO> {
    const authorId = this.requireAuthor(auth)
    const ticket = await this.tickets.findByIdForAuthor(ticketId, authorId)
    if (!ticket) throw AppError.notFound('Ticket not found')
    const messages = await this.messages.listByTicket(ticketId, { includeInternal: false })
    return { ...ticket, messages }
  }

  async addAuthorMessage(
    auth: AuthContext | undefined,
    ticketId: string,
    body: string,
  ): Promise<TicketMessageDTO> {
    const authorId = this.requireAuthor(auth)
    const ticket = await this.tickets.findByIdForAuthor(ticketId, authorId)
    if (!ticket) throw AppError.notFound('Ticket not found')
    if (ticket.status === TICKET_STATUS.CLOSED) throw AppError.badRequest('This ticket is closed')

    const message = await this.messages.create({
      ticketId,
      senderType: 'author',
      senderUserId: auth?.userId ?? null,
      senderName: ticket.authorName,
      body,
      isInternal: false,
    })

    await this.tickets.touch(ticketId)

    socketIOService.emit('message', {
      ticketId,
      authorId,
      status: ticket.status,
      at: new Date().toISOString(),
    })

    return message
  }
}
