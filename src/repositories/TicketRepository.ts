import { sql } from 'kysely'
import { db as database } from '../db/db.js'
import type { AppDatabase } from '../db/db.js'
import type { AdminStatsDTO, TicketDTO } from '../types/api.js'
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from '../types/domain.js'

export interface TicketFilters {
  status?: TicketStatus
  category?: TicketCategory
  priority?: TicketPriority
  assignedToUserId?: string
  q?: string
  from?: string
  to?: string
  sort?: 'oldest' | 'newest' | 'priority'
}

export interface CreateTicketRow {
  authorId: string
  bookId: string | null
  subject: string
  description: string
  attachmentUrl: string | null
}

export interface UpdateTicketRow {
  status?: TicketStatus
  category?: TicketCategory
  priority?: TicketPriority
  assignedToUserId?: string | null
}

interface TicketRow {
  id: string
  ticket_number: string
  author_id: string
  book_id: string | null
  subject: string
  description: string
  attachment_url: string | null
  status: string
  category: string
  ai_category: string | null
  category_overridden: boolean
  priority: string
  ai_priority: string | null
  priority_overridden: boolean
  ai_status: string
  assigned_to: string | null
  created_at: Date
  updated_at: Date
  resolved_at: Date | null
  author_name: string
  author_email: string | null
  book_title: string | null
  assignee_name: string | null
}

function asIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null
  if (value instanceof Date) return value.toISOString()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function toDTO(row: TicketRow): TicketDTO {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    authorId: row.author_id,
    authorName: row.author_name,
    authorEmail: row.author_email ?? '',
    bookId: row.book_id,
    bookTitle: row.book_title,
    subject: row.subject,
    description: row.description,
    attachmentUrl: row.attachment_url,
    status: row.status,
    category: row.category,
    aiCategory: row.ai_category,
    categoryOverridden: row.category_overridden,
    priority: row.priority,
    aiPriority: row.ai_priority,
    priorityOverridden: row.priority_overridden,
    aiStatus: row.ai_status,
    assignedTo: row.assigned_to
      ? { id: row.assigned_to, name: row.assignee_name ?? 'Support agent' }
      : null,
    createdAt: asIso(row.created_at) ?? new Date(0).toISOString(),
    updatedAt: asIso(row.updated_at) ?? new Date(0).toISOString(),
    resolvedAt: asIso(row.resolved_at),
  }
}

export class TicketRepository {
  private readonly db: AppDatabase

  constructor() {
    this.db = database
  }

  private baseQuery() {
    return this.db
      .selectFrom('tickets as t')
      .innerJoin('authors as a', 'a.author_id', 't.author_id')
      .leftJoin('books as b', 'b.id', 't.book_id')
      .leftJoin('users as u', 'u.id', 't.assigned_to')
      .leftJoin('authors as uau', 'uau.author_id', 'u.author_id')
      .select([
        't.id',
        't.ticket_number',
        't.author_id',
        't.book_id',
        't.subject',
        't.description',
        't.attachment_url',
        't.status',
        't.category',
        't.ai_category',
        't.category_overridden',
        't.priority',
        't.ai_priority',
        't.priority_overridden',
        't.ai_status',
        't.assigned_to',
        't.created_at',
        't.updated_at',
        't.resolved_at',
        'a.name as author_name',
        'a.email as author_email',
        'b.title as book_title',
        sql<string | null>`COALESCE(uau.name, u.email)`.as('assignee_name'),
      ])
  }

  async create(input: CreateTicketRow): Promise<TicketDTO> {
    const inserted = await this.db
      .insertInto('tickets')
      .values({
        author_id: input.authorId,
        book_id: input.bookId,
        subject: input.subject,
        description: input.description,
        attachment_url: input.attachmentUrl,
      })
      .returning('id')
      .executeTakeFirstOrThrow()

    const ticket = await this.findById(inserted.id)
    if (!ticket) throw new Error('Ticket insert failed')
    return ticket
  }

  async findById(id: string): Promise<TicketDTO | null> {
    const row = await this.baseQuery().where('t.id', '=', id).executeTakeFirst()
    return row ? toDTO(row as unknown as TicketRow) : null
  }

  async findByIdForAuthor(id: string, authorId: string): Promise<TicketDTO | null> {
    const row = await this.baseQuery()
      .where('t.id', '=', id)
      .where('t.author_id', '=', authorId)
      .executeTakeFirst()
    return row ? toDTO(row as unknown as TicketRow) : null
  }

  async listByAuthor(authorId: string): Promise<TicketDTO[]> {
    const rows = await this.baseQuery()
      .where('t.author_id', '=', authorId)
      .orderBy('t.created_at', 'desc')
      .execute()
    return rows.map((row) => toDTO(row as unknown as TicketRow))
  }

  async listForAdmin(filters: TicketFilters, _currentUserId: string): Promise<TicketDTO[]> {
    let query = this.baseQuery()

    if (filters.status) query = query.where('t.status', '=', filters.status)
    if (filters.category) query = query.where('t.category', '=', filters.category)
    if (filters.priority) query = query.where('t.priority', '=', filters.priority)
    if (filters.assignedToUserId) {
      query = query.where('t.assigned_to', '=', filters.assignedToUserId)
    }
    if (filters.q) {
      const pattern = `%${filters.q}%`
      query = query.where((eb) =>
        eb.or([eb('t.subject', 'ilike', pattern), eb('a.name', 'ilike', pattern)]),
      )
    }
    if (filters.from) {
      query = query.where(sql<boolean>`t.created_at >= ${filters.from}::timestamptz`)
    }
    if (filters.to) {
      query = query.where(sql<boolean>`t.created_at <= ${filters.to}::timestamptz`)
    }

    if (filters.sort === 'newest') {
      query = query.orderBy('t.created_at', 'desc')
    } else if (filters.sort === 'oldest') {
      query = query.orderBy('t.created_at', 'asc')
    } else {
      query = query
        .orderBy(
          sql`CASE t.priority
            WHEN 'Critical' THEN 0
            WHEN 'High' THEN 1
            WHEN 'Medium' THEN 2
            ELSE 3
          END`,
        )
        .orderBy('t.created_at', 'asc')
    }

    const rows = await query.limit(200).execute()
    return rows.map((row) => toDTO(row as unknown as TicketRow))
  }

  async update(id: string, patch: UpdateTicketRow): Promise<TicketDTO> {
    const updates: Record<string, unknown> = {}

    if (patch.status !== undefined) {
      updates.status = patch.status
      if (patch.status === 'Resolved') updates.resolved_at = sql`now()`
      else if (patch.status === 'Closed') updates.resolved_at = sql`COALESCE(resolved_at, now())`
      else updates.resolved_at = null
    }
    if (patch.category !== undefined) {
      updates.category = patch.category
      updates.category_overridden = true
    }
    if (patch.priority !== undefined) {
      updates.priority = patch.priority
      updates.priority_overridden = true
    }
    if (patch.assignedToUserId !== undefined) {
      updates.assigned_to = patch.assignedToUserId
    }

    if (Object.keys(updates).length === 0) {
      const existing = await this.findById(id)
      if (!existing) throw new Error('Ticket not found')
      return existing
    }

    updates.updated_at = sql`now()`

    await this.db
      .updateTable('tickets')
      .set(updates as never)
      .where('id', '=', id)
      .execute()

    const ticket = await this.findById(id)
    if (!ticket) throw new Error('Ticket not found after update')
    return ticket
  }

  async applyAiResult(
    id: string,
    result: { category: TicketCategory; priority: TicketPriority },
  ): Promise<void> {
    await this.db
      .updateTable('tickets')
      .set({
        ai_category: result.category,
        ai_priority: result.priority,
        ai_status: 'ok',
        category: sql`CASE WHEN category_overridden THEN category ELSE ${result.category} END`,
        priority: sql`CASE WHEN priority_overridden THEN priority ELSE ${result.priority} END`,
        updated_at: sql`now()`,
      })
      .where('id', '=', id)
      .execute()
  }

  async applyDefaultClassification(id: string): Promise<void> {
    await this.db
      .updateTable('tickets')
      .set({
        ai_status: 'ok',
        updated_at: sql`now()`,
      })
      .where('id', '=', id)
      .execute()
  }

  async touch(id: string): Promise<void> {
    await this.db
      .updateTable('tickets')
      .set({ updated_at: sql`now()` })
      .where('id', '=', id)
      .execute()
  }

  async stats(): Promise<AdminStatsDTO> {
    const counts = await this.db
      .selectFrom('tickets')
      .select((eb) => [
        eb.fn.countAll<number>().as('total'),
        sql<number>`count(*) FILTER (WHERE status = 'Open')::int`.as('open'),
        sql<number>`count(*) FILTER (WHERE status = 'In Progress')::int`.as('in_progress'),
        sql<number>`count(*) FILTER (WHERE status = 'Resolved')::int`.as('resolved'),
        sql<number>`count(*) FILTER (WHERE status = 'Closed')::int`.as('closed'),
      ])
      .executeTakeFirstOrThrow()

    const byCategory = await this.db
      .selectFrom('tickets')
      .select(['category', sql<number>`count(*)::int`.as('count')])
      .groupBy('category')
      .execute()

    const byPriority = await this.db
      .selectFrom('tickets')
      .select(['priority', sql<number>`count(*)::int`.as('count')])
      .groupBy('priority')
      .execute()

    const categoryMap: Record<string, number> = {}
    for (const category of TICKET_CATEGORIES) categoryMap[category] = 0
    for (const row of byCategory) categoryMap[row.category] = Number(row.count)

    const priorityMap: Record<string, number> = {}
    for (const priority of TICKET_PRIORITIES) priorityMap[priority] = 0
    for (const row of byPriority) priorityMap[row.priority] = Number(row.count)

    return {
      total: Number(counts.total),
      open: Number(counts.open),
      inProgress: Number(counts.in_progress),
      resolved: Number(counts.resolved),
      closed: Number(counts.closed),
      byCategory: categoryMap as Record<TicketCategory, number>,
      byPriority: priorityMap as Record<TicketPriority, number>,
    }
  }
}
