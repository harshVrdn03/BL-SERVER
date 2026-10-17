import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import bcrypt from 'bcryptjs'
import { db, sql, withTransaction } from './db.js'

const sampleFile =
  process.env.SEED_FILE ??
  path.resolve(process.cwd(), 'sample-data.json')

const AUTHOR_PASSWORD = process.env.SEED_AUTHOR_PASSWORD ?? 'password123'
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@bl.com'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'admin123'

interface SampleBook {
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
  available_on: string[]
}

interface SampleAuthor {
  author_id: string
  name: string
  email: string
  phone: string
  city: string
  joined_date: string
  books: SampleBook[]
}

interface SampleData {
  authors: SampleAuthor[]
}

export async function seedSampleData(): Promise<void> {
  const raw = fs.readFileSync(sampleFile, 'utf8')
  const data = JSON.parse(raw) as SampleData

  const authorHash = await bcrypt.hash(AUTHOR_PASSWORD, 10)
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10)

  await withTransaction(async (trx) => {
    let authorCount = 0
    let bookCount = 0

    for (const author of data.authors) {
      await trx
        .insertInto('authors')
        .values({
          author_id: author.author_id,
          name: author.name,
          email: author.email,
          phone: author.phone,
          city: author.city,
          joined_date: author.joined_date,
        })
        .onConflict((oc) =>
          oc.column('author_id').doUpdateSet({
            name: author.name,
            email: author.email,
            phone: author.phone,
            city: author.city,
            joined_date: author.joined_date,
          }),
        )
        .execute()
      authorCount += 1

      if (author.email) {
        await trx
          .insertInto('users')
          .values({
            email: author.email,
            password_hash: authorHash,
            role: 'author',
            author_id: author.author_id,
          })
          .onConflict((oc) =>
            oc.column('email').doUpdateSet({
              password_hash: authorHash,
              role: 'author',
              author_id: author.author_id,
            }),
          )
          .execute()
      }

      for (const book of author.books) {
        const availableOnJson = JSON.stringify(book.available_on ?? [])
        await trx
          .insertInto('books')
          .values({
            book_id: book.book_id,
            author_id: author.author_id,
            title: book.title,
            isbn: book.isbn,
            genre: book.genre,
            publication_date: book.publication_date,
            status: book.status,
            mrp: book.mrp,
            author_royalty_per_copy: book.author_royalty_per_copy,
            total_copies_sold: book.total_copies_sold,
            total_royalty_earned: book.total_royalty_earned,
            royalty_paid: book.royalty_paid,
            royalty_pending: book.royalty_pending,
            last_royalty_payout_date: book.last_royalty_payout_date,
            print_partner: book.print_partner,
            available_on: sql`${availableOnJson}::jsonb` as unknown as string[],
          })
          .onConflict((oc) =>
            oc.column('book_id').doUpdateSet({
              author_id: author.author_id,
              title: book.title,
              isbn: book.isbn,
              genre: book.genre,
              publication_date: book.publication_date,
              status: book.status,
              mrp: book.mrp,
              author_royalty_per_copy: book.author_royalty_per_copy,
              total_copies_sold: book.total_copies_sold,
              total_royalty_earned: book.total_royalty_earned,
              royalty_paid: book.royalty_paid,
              royalty_pending: book.royalty_pending,
              last_royalty_payout_date: book.last_royalty_payout_date,
              print_partner: book.print_partner,
              available_on: sql`${availableOnJson}::jsonb` as unknown as string[],
            }),
          )
          .execute()
        bookCount += 1
      }
    }

    await trx
      .insertInto('users')
      .values({
        email: ADMIN_EMAIL,
        password_hash: adminHash,
        role: 'admin',
        author_id: null,
      })
      .onConflict((oc) =>
        oc.column('email').doUpdateSet({
          password_hash: adminHash,
          role: 'admin',
          author_id: null,
        }),
      )
      .execute()

    console.log(`Seeded ${authorCount} authors, ${bookCount} books, 1 admin.`)
  })

  console.log(`Author login: <author email> / ${AUTHOR_PASSWORD}`)
  console.log(`Admin login:  ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  seedSampleData()
    .then(() => db.destroy())
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
