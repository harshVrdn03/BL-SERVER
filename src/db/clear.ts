import { db, sql } from './db.js'
import { runMigrations } from './migrate.js'

const TABLES = [
  'ticket_messages',
  'tickets',
  'books',
  'users',
  'authors',
  'knowledge_chunks',
  '_migrations',
]

async function clear(): Promise<void> {
  console.log('Dropping existing tables...')
  await sql.raw(`DROP TABLE IF EXISTS ${TABLES.join(', ')} CASCADE`).execute(db)
  await sql.raw('DROP SEQUENCE IF EXISTS ticket_number_seq CASCADE').execute(db)

  await runMigrations()
  console.log('Database cleared. Schema is empty and ready to use.')
}

clear()
  .then(() => db.destroy())
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
