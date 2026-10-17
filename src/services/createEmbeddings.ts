import { Embeddings } from '@langchain/core/embeddings'
import { env } from '../config/env.js'

interface NvidiaEmbeddingsOptions {
  apiKey: string
  baseURL: string
  model: string
}

class NvidiaEmbeddings extends Embeddings {
  private readonly endpoint: string
  private readonly apiKey: string
  private readonly model: string

  constructor(options: NvidiaEmbeddingsOptions) {
    super({})
    this.endpoint = `${options.baseURL.replace(/\/$/, '')}/embeddings`
    this.apiKey = options.apiKey
    this.model = options.model
  }

  override async embedDocuments(texts: string[]): Promise<number[][]> {
    return this.request(texts, 'passage')
  }

  override async embedQuery(text: string): Promise<number[]> {
    const [vector] = await this.request([text], 'query')
    return vector
  }

  private async request(input: string[], inputType: 'passage' | 'query'): Promise<number[][]> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input,
        model: this.model,
        input_type: inputType,
        encoding_format: 'float',
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(
        `NVIDIA embeddings request failed (${response.status}): ${detail.slice(0, 300)}`,
      )
    }

    const payload = (await response.json()) as {
      data: Array<{ index: number; embedding: number[] }>
    }

    return payload.data
      .slice()
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding)
  }
}

export function createEmbeddings(): Embeddings | null {
  if (!env.AI_ENABLED || !env.NVIDIA_API_KEY) return null

  return new NvidiaEmbeddings({
    apiKey: env.NVIDIA_API_KEY,
    baseURL: env.NVIDIA_BASE_URL,
    model: env.EMBEDDING_MODEL,
  })
}
