import type { ColumnType, Generated } from 'kysely'

export type Timestamp = ColumnType<Date, string | Date | undefined, string | Date>
export type DateColumn = ColumnType<string | null, string | null, string | null>
export type JsonColumn<T> = ColumnType<T, T | string, T | string>

export interface AuthorsTable {
  author_id: string
  name: string
  email: string | null
  phone: string | null
  city: string | null
  joined_date: DateColumn
}

export interface BooksTable {
  id: Generated<string>
  book_id: string
  author_id: string
  title: string
  isbn: string | null
  genre: string | null
  publication_date: DateColumn
  status: string
  mrp: number | null
  author_royalty_per_copy: number | null
  total_copies_sold: number
  total_royalty_earned: number
  royalty_paid: number
  royalty_pending: number
  last_royalty_payout_date: DateColumn
  print_partner: string | null
  available_on: JsonColumn<string[]>
}

export interface UsersTable {
  id: Generated<string>
  email: string
  password_hash: string
  role: 'author' | 'admin'
  author_id: string | null
  created_at: Generated<Timestamp>
}

export interface TicketsTable {
  id: Generated<string>
  ticket_number: Generated<string>
  author_id: string
  book_id: string | null
  subject: string
  description: string
  attachment_url: string | null
  status: Generated<string>
  category: Generated<string>
  ai_category: string | null
  category_overridden: Generated<boolean>
  priority: Generated<string>
  ai_priority: string | null
  priority_overridden: Generated<boolean>
  ai_status: Generated<string>
  assigned_to: string | null
  created_at: Generated<Timestamp>
  updated_at: Generated<Timestamp>
  resolved_at: Timestamp | null
}

export interface TicketMessagesTable {
  id: Generated<string>
  ticket_id: string
  sender_type: 'author' | 'admin'
  sender_user_id: string | null
  sender_name: string
  body: string
  is_internal: Generated<boolean>
  created_at: Generated<Timestamp>
}

export interface MigrationsTable {
  name: string
  applied_at: Generated<Timestamp>
}

export interface KnowledgeChunksTable {
  id: string
  category: string
  title: string
  content: string
  embedding: unknown | null
  created_at: Generated<Timestamp>
}

export interface Database {
  _migrations: MigrationsTable
  authors: AuthorsTable
  books: BooksTable
  users: UsersTable
  tickets: TicketsTable
  ticket_messages: TicketMessagesTable
  knowledge_chunks: KnowledgeChunksTable
}
