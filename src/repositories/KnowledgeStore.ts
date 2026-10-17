import type { Embeddings } from '@langchain/core/embeddings'
import { sql } from 'kysely'
import { db as database } from '../db/db.js'
import type { AppDatabase } from '../db/db.js'
import type { TicketCategory } from '../types/domain.js'
import { createEmbeddings } from '../services/createEmbeddings.js'
import { KNOWLEDGE_DOCS, type KnowledgeDoc } from '../services/knowledgeDocs.js'

function toVectorLiteral(values: number[]): string {
  return `[${values.join(',')}]`
}

export class KnowledgeStore {
  private readonly db: AppDatabase
  private readonly embeddings: Embeddings | null

  constructor() {
    this.db = database
    this.embeddings = createEmbeddings()
  }

  get canEmbed(): boolean {
    return this.embeddings !== null
  }

  async seed(docs: KnowledgeDoc[] = KNOWLEDGE_DOCS): Promise<{ count: number; embedded: boolean }> {
    let embedded = false

    for (const doc of docs) {
      let embeddingLiteral: string | null = null
      if (this.embeddings) {
        const [vector] = await this.embeddings.embedDocuments([`${doc.title}\n${doc.content}`])
        embeddingLiteral = toVectorLiteral(vector)
        embedded = true
      }

      if (embeddingLiteral) {
        await sql`
          INSERT INTO knowledge_chunks (id, category, title, content, embedding)
          VALUES (
            ${doc.id},
            ${doc.category},
            ${doc.title},
            ${doc.content},
            ${embeddingLiteral}::vector
          )
          ON CONFLICT (id) DO UPDATE SET
            category = EXCLUDED.category,
            title = EXCLUDED.title,
            content = EXCLUDED.content,
            embedding = EXCLUDED.embedding
        `.execute(this.db)
      } else {
        await sql`
          INSERT INTO knowledge_chunks (id, category, title, content, embedding)
          VALUES (${doc.id}, ${doc.category}, ${doc.title}, ${doc.content}, NULL)
          ON CONFLICT (id) DO UPDATE SET
            category = EXCLUDED.category,
            title = EXCLUDED.title,
            content = EXCLUDED.content
        `.execute(this.db)
      }
    }

    return { count: docs.length, embedded }
  }

  async search(
    query: string,
    options: { category?: TicketCategory; k?: number } = {},
  ): Promise<string[]> {
    const k = options.k ?? 4

    if (this.embeddings) {
      try {
        const vector = await this.embeddings.embedQuery(query)
        const literal = toVectorLiteral(vector)

        const rows = options.category
          ? await sql<{ content: string; title: string }>`
              SELECT title, content
              FROM knowledge_chunks
              WHERE embedding IS NOT NULL AND category = ${options.category}
              ORDER BY embedding <=> ${literal}::vector
              LIMIT ${k}
            `.execute(this.db)
          : await sql<{ content: string; title: string }>`
              SELECT title, content
              FROM knowledge_chunks
              WHERE embedding IS NOT NULL
              ORDER BY embedding <=> ${literal}::vector
              LIMIT ${k}
            `.execute(this.db)

        if (rows.rows.length > 0) {
          return rows.rows.map((row) => `${row.title}\n${row.content}`)
        }
      } catch {
      }
    }

    return this.fallbackSearch(query, options.category, k)
  }

  private async fallbackSearch(
    query: string,
    category: TicketCategory | undefined,
    k: number,
  ): Promise<string[]> {
    const pattern = `%${query.slice(0, 80)}%`

    let rows = category
      ? await sql<{ title: string; content: string }>`
          SELECT title, content FROM knowledge_chunks
          WHERE category = ${category}
          ORDER BY created_at ASC
          LIMIT ${k}
        `.execute(this.db)
      : await sql<{ title: string; content: string }>`
          SELECT title, content FROM knowledge_chunks
          WHERE content ILIKE ${pattern} OR title ILIKE ${pattern}
          ORDER BY created_at ASC
          LIMIT ${k}
        `.execute(this.db)

    if (rows.rows.length === 0) {
      rows = await sql<{ title: string; content: string }>`
        SELECT title, content FROM knowledge_chunks
        ORDER BY created_at ASC
        LIMIT ${k}
      `.execute(this.db)
    }

    return rows.rows.map((row) => `${row.title}\n${row.content}`)
  }
}
