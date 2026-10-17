import { pathToFileURL } from 'node:url'
import { db } from './db.js'
import { KnowledgeStore } from '../repositories/KnowledgeStore.js'

export async function seedKnowledge(): Promise<void> {
  const store = new KnowledgeStore()
  const result = await store.seed()
  console.log(
    `Seeded ${result.count} knowledge chunks` +
      (result.embedded
        ? ' (with embeddings)'
        : ' (text only — configure an NVIDIA key to embed)'),
  )
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  seedKnowledge()
    .then(() => db.destroy())
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
