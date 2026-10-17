import { Kysely, PostgresDialect, sql } from 'kysely'
import pg from 'pg'
import { env } from '../config/env.js'
import type { Database } from './types.js'

const { Pool } = pg

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
})

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error', error)
})

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
})

export async function withTransaction<T>(fn: (trx: typeof db) => Promise<T>): Promise<T> {
  return db.transaction().execute(fn)
}

export { sql }
export type { Database }
export type AppDatabase = typeof db
