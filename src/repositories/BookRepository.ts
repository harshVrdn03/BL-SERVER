import { sql } from 'kysely'
import { db as database } from '../db/db.js'
import type { AppDatabase } from '../db/db.js'
import type { BookDTO } from '../types/api.js'

interface BookRow {
  id: string
  book_id: string
  title: string
  isbn: string | null
  genre: string | null
  publication_date: string | null
  status: string
  mrp: number | null
  author_royalty_per_copy: number | null
  total_copies_sold: number
  total_royalty_earned: number
  royalty_paid: number
  royalty_pending: number
  last_royalty_payout_date: string | null
  print_partner: string | null
  available_on: unknown
}

function toDTO(row: BookRow): BookDTO {
  return {
    id: row.id,
    bookId: row.book_id,
    title: row.title,
    isbn: row.isbn,
    genre: row.genre,
    publicationDate: row.publication_date,
    status: row.status,
    mrp: row.mrp,
    authorRoyaltyPerCopy: row.author_royalty_per_copy,
    totalCopiesSold: row.total_copies_sold,
    totalRoyaltyEarned: row.total_royalty_earned,
    royaltyPaid: row.royalty_paid,
    royaltyPending: row.royalty_pending,
    lastRoyaltyPayoutDate: row.last_royalty_payout_date,
    printPartner: row.print_partner,
    availableOn: Array.isArray(row.available_on) ? (row.available_on as string[]) : [],
  }
}

export class BookRepository {
  private readonly db: AppDatabase

  constructor() {
    this.db = database
  }

  private baseQuery() {
    return this.db
      .selectFrom('books')
      .select([
        'id',
        'book_id',
        'title',
        'isbn',
        'genre',
        sql<string | null>`publication_date::text`.as('publication_date'),
        'status',
        'mrp',
        'author_royalty_per_copy',
        'total_copies_sold',
        'total_royalty_earned',
        'royalty_paid',
        'royalty_pending',
        sql<string | null>`last_royalty_payout_date::text`.as('last_royalty_payout_date'),
        'print_partner',
        'available_on',
      ])
  }

  async listByAuthor(authorId: string): Promise<BookDTO[]> {
    const rows = await this.baseQuery()
      .where('author_id', '=', authorId)
      .orderBy('publication_date', (ob) => ob.desc().nullsLast())
      .orderBy('title')
      .execute()
    return rows.map((row) => toDTO(row as BookRow))
  }

  async findByIdForAuthor(id: string, authorId: string): Promise<BookDTO | null> {
    const row = await this.baseQuery()
      .where('id', '=', id)
      .where('author_id', '=', authorId)
      .executeTakeFirst()
    return row ? toDTO(row as BookRow) : null
  }

  async findById(id: string): Promise<Pick<BookDTO, 'id' | 'title'> | null> {
    const row = await this.db
      .selectFrom('books')
      .select(['id', 'title'])
      .where('id', '=', id)
      .executeTakeFirst()
    return row ?? null
  }
}
