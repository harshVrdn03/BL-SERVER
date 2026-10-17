import { ChatOpenAI } from '@langchain/openai'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { env } from '../config/env.js'

export function createModel(): BaseChatModel | null {
  if (!env.AI_ENABLED || !env.NVIDIA_API_KEY) return null

  return new ChatOpenAI({
    apiKey: env.NVIDIA_API_KEY,
    model: env.AI_MODEL,
    temperature: 0,
    timeout: env.AI_TIMEOUT_MS,
    maxRetries: 2,
    configuration: {
      baseURL: env.NVIDIA_BASE_URL,
    },
  })
}
