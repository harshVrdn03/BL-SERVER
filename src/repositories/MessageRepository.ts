import { db as database } from '../db/db.js'
import type { AppDatabase } from '../db/db.js'
import type { TicketMessageDTO } from '../types/api.js'

interface MessageRow {
  id: string
  ticket_id: string
  sender_type: 'author' | 'admin'
  sender_name: string
  body: string
  is_internal: boolean
  created_at: Date
}

function toDTO(row: MessageRow): TicketMessageDTO {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    senderType: row.sender_type,
    senderName: row.sender_name,
    body: row.body,
    isInternal: row.is_internal,
    createdAt: row.created_at.toISOString(),
  }
}

export interface CreateMessageInput {
  ticketId: string
  senderType: 'author' | 'admin'
  senderUserId: string | null
  senderName: string
  body: string
  isInternal: boolean
}

export class MessageRepository {
  private readonly db: AppDatabase

  constructor() {
    this.db = database
  }

  async create(input: CreateMessageInput): Promise<TicketMessageDTO> {
    const row = await this.db
      .insertInto('ticket_messages')
      .values({
        ticket_id: input.ticketId,
        sender_type: input.senderType,
        sender_user_id: input.senderUserId,
        sender_name: input.senderName,
        body: input.body,
        is_internal: input.isInternal,
      })
      .returning(['id', 'ticket_id', 'sender_type', 'sender_name', 'body', 'is_internal', 'created_at'])
      .executeTakeFirstOrThrow()

    return toDTO(row as unknown as MessageRow)
  }

  async listByTicket(
    ticketId: string,
    options: { includeInternal: boolean },
  ): Promise<TicketMessageDTO[]> {
    let query = this.db
      .selectFrom('ticket_messages')
      .select(['id', 'ticket_id', 'sender_type', 'sender_name', 'body', 'is_internal', 'created_at'])
      .where('ticket_id', '=', ticketId)

    if (!options.includeInternal) {
      query = query.where('is_internal', '=', false)
    }

    const rows = await query.orderBy('created_at', 'asc').execute()
    return rows.map((row) => toDTO(row as unknown as MessageRow))
  }
}
