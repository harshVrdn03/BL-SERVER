import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { db, sql } from './db.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.join(here, 'migrations')

export async function runMigrations(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `.execute(db)

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  const applied = await db.selectFrom('_migrations').select('name').execute()
  const done = new Set(applied.map((row) => row.name))

  for (const file of files) {
    if (done.has(file)) {
      console.log(`skip  ${file}`)
      continue
    }
    const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    await db.transaction().execute(async (trx) => {
      await sql.raw(migrationSql).execute(trx)
      await trx.insertInto('_migrations').values({ name: file }).execute()
    })
    console.log(`apply ${file}`)
  }

  console.log('Migrations complete.')
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  runMigrations()
    .then(() => db.destroy())
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
