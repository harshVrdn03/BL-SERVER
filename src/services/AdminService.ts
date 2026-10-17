import { AppError } from '../core/AppError.js'
import { Logger } from '../core/Logger.js'
import { env } from '../config/env.js'
import { socketIOService } from '../core/SocketIO.js'
import type { AdminStatsDTO, AiDraftDTO, TicketDTO, TicketMessageDTO, TicketSummaryDTO } from '../types/api.js'
import type { AuthContext, TicketCategory } from '../types/domain.js'
import { AIService } from './AIService.js'
import { MessageRepository } from '../repositories/MessageRepository.js'
import { TicketRepository, type TicketFilters } from '../repositories/TicketRepository.js'
import type { AdminPostMessageInput, AdminTicketQuery, AdminUpdateTicketInput } from '../schemas/ticket.schemas.js'
import { UserRepository } from '../repositories/UserRepository.js'
import { TICKET_STATUS } from '../enums/ticketEnums.js'

function toSummary(ticket: TicketDTO): TicketSummaryDTO {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    authorName: ticket.authorName,
    bookTitle: ticket.bookTitle,
    subject: ticket.subject,
    status: ticket.status,
    category: ticket.category,
    priority: ticket.priority,
    aiStatus: ticket.aiStatus,
    assignedTo: ticket.assignedTo,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  }
}

export class AdminService {
  private readonly tickets: TicketRepository
  private readonly messages: MessageRepository
  private readonly users: UserRepository
  private readonly ai: AIService
  private readonly logger: Logger

  constructor() {
    this.tickets = new TicketRepository()
    this.messages = new MessageRepository()
    this.users = new UserRepository()
    this.ai = new AIService()
    this.logger = new Logger(env.LOG_LEVEL).child('admin')
  }

  private requireAuth(auth: AuthContext | undefined): AuthContext {
    if (!auth) throw AppError.unauthorized()
    return auth
  }

  async listTickets(query: AdminTicketQuery, auth: AuthContext | undefined): Promise<TicketSummaryDTO[]> {
    const context = this.requireAuth(auth)
    const filters: TicketFilters = {
      status: query.status,
      category: query.category,
      priority: query.priority,
      assignedToUserId: query.assignedToMe ? context.userId : undefined,
      q: query.q,
      from: query.from,
      to: query.to,
      sort: query.sort,
    }
    const tickets = await this.tickets.listForAdmin(filters, context.userId)
    return tickets.map(toSummary)
  }

  async getTicket(ticketId: string): Promise<TicketDTO> {
    const ticket = await this.tickets.findById(ticketId)
    if (!ticket) throw AppError.notFound('Ticket not found')
    const messages = await this.messages.listByTicket(ticketId, { includeInternal: true })
    return { ...ticket, messages }
  }

  async updateTicket(
    ticketId: string,
    input: AdminUpdateTicketInput,
    auth: AuthContext | undefined,
  ): Promise<TicketDTO> {
    this.requireAuth(auth)
    const existing = await this.tickets.findById(ticketId)
    if (!existing) throw AppError.notFound('Ticket not found')

    if (input.assignedToUserId) {
      const assignee = await this.users.findById(input.assignedToUserId)
      if (!assignee || assignee.role !== 'admin') {
        throw AppError.badRequest('Assignee must be a support admin')
      }
    }

    const ticket = await this.tickets.update(ticketId, {
      status: input.status,
      category: input.category,
      priority: input.priority,
      assignedToUserId: input.assignedToUserId,
    })

    this.publishUpdate(ticket)
    return ticket
  }

  async assignToSelf(ticketId: string, auth: AuthContext | undefined): Promise<TicketDTO> {
    const context = this.requireAuth(auth)
    const existing = await this.tickets.findById(ticketId)
    if (!existing) throw AppError.notFound('Ticket not found')

    const ticket = await this.tickets.update(ticketId, {
      assignedToUserId: context.userId,
      status: existing.status === TICKET_STATUS.OPEN ? TICKET_STATUS.IN_PROGRESS : undefined,
    })

    this.publishUpdate(ticket)
    return ticket
  }

  async addMessage(
    ticketId: string,
    input: AdminPostMessageInput,
    auth: AuthContext | undefined,
  ): Promise<TicketMessageDTO> {
    const context = this.requireAuth(auth)
    const ticket = await this.tickets.findById(ticketId)
    if (!ticket) throw AppError.notFound('Ticket not found')

    const adminUser = await this.users.findById(context.userId)
    const message = await this.messages.create({
      ticketId,
      senderType: 'admin',
      senderUserId: context.userId,
      senderName: adminUser?.authorName ?? adminUser?.email ?? 'Support Team',
      body: input.body,
      isInternal: input.isInternal ?? false,
    })

    await this.tickets.touch(ticketId)

    socketIOService.emit('message', {
      ticketId,
      authorId: ticket.authorId,
      status: ticket.status,
      at: new Date().toISOString(),
    })

    return message
  }

  async generateDraft(ticketId: string): Promise<AiDraftDTO> {
    const ticket = await this.tickets.findById(ticketId)
    if (!ticket) throw AppError.notFound('Ticket not found')

    const history = await this.messages.listByTicket(ticketId, { includeInternal: false })
    const conversation = history
      .map((message) => `${message.senderType === 'author' ? 'Author' : 'Support'} (${message.senderName}): ${message.body}`)
      .join('\n')

    const result = await this.ai.generateDraft({
      authorName: ticket.authorName,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category as TicketCategory,
      bookTitle: ticket.bookTitle,
      conversation,
    })

    return {
      draft: result.draft,
      generatedAt: new Date().toISOString(),
      provider: result.provider,
      model: result.model,
      tokensUsed: result.usage?.totalTokens ?? null,
    }
  }

  async stats(): Promise<AdminStatsDTO> {
    return this.tickets.stats()
  }

  private publishUpdate(ticket: TicketDTO): void {
    socketIOService.emit('updated', {
      ticketId: ticket.id,
      authorId: ticket.authorId,
      status: ticket.status,
      at: new Date().toISOString(),
    })
  }
}