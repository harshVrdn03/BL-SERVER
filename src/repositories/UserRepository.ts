import { sql } from 'kysely'
import { db as database } from '../db/db.js'
import type { AppDatabase } from '../db/db.js'
import type { Role } from '../types/domain.js'

export interface UserRecord {
  id: string
  email: string
  passwordHash: string
  role: Role
  authorId: string | null
  authorName: string | null
  authorEmail: string | null
  authorPhone: string | null
  authorCity: string | null
  authorJoinedDate: string | null
}

interface UserRow {
  id: string
  email: string
  password_hash: string
  role: Role
  author_id: string | null
  author_name: string | null
  author_email: string | null
  author_phone: string | null
  author_city: string | null
  author_joined_date: string | null
}

function toRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    authorId: row.author_id,
    authorName: row.author_name,
    authorEmail: row.author_email,
    authorPhone: row.author_phone,
    authorCity: row.author_city,
    authorJoinedDate: row.author_joined_date ? String(row.author_joined_date) : null,
  }
}

export class UserRepository {
  private readonly db: AppDatabase

  constructor() {
    this.db = database
  }

  private baseQuery() {
    return this.db
      .selectFrom('users as u')
      .leftJoin('authors as a', 'a.author_id', 'u.author_id')
      .select([
        'u.id',
        'u.email',
        'u.password_hash',
        'u.role',
        'u.author_id',
        'a.name as author_name',
        'a.email as author_email',
        'a.phone as author_phone',
        'a.city as author_city',
        sql<string | null>`a.joined_date::text`.as('author_joined_date'),
      ])
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const row = await this.baseQuery()
      .where(sql<boolean>`lower(u.email) = ${email.toLowerCase()}`)
      .executeTakeFirst()
    return row ? toRecord(row as unknown as UserRow) : null
  }

  async findById(id: string): Promise<UserRecord | null> {
    const row = await this.baseQuery().where('u.id', '=', id).executeTakeFirst()
    return row ? toRecord(row as unknown as UserRow) : null
  }
}
