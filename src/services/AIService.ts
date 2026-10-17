import { z } from 'zod'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { AIMessage, BaseMessage } from '@langchain/core/messages'
import { env } from '../config/env.js'
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type TicketCategory,
  type TicketPriority,
} from '../types/domain.js'
import { KnowledgeStore } from '../repositories/KnowledgeStore.js'
import { createModel } from './createModel.js'
import {
  CLASSIFY_SYSTEM_PROMPT,
  DRAFT_SYSTEM_PROMPT,
  buildClassifyHuman,
  buildDraftHuman,
  type ClassifyInput,
  type DraftInput,
} from './prompts.js'
import { TICKET_CATEGORY, TICKET_PRIORITY, type TicketCategoryValue, type TicketPriorityValue } from '../enums/ticketEnums.js'

const classificationSchema = z.object({
  category: z.enum(TICKET_CATEGORIES).describe('The best matching support category'),
  priority: z.enum(TICKET_PRIORITIES).describe('Urgency of the request'),
  reasoning: z.string().describe('One short sentence explaining the choice'),
})

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface ClassificationResult {
  category: TicketCategory
  priority: TicketPriority
  reasoning: string
  usage: TokenUsage | null
}

export interface DraftResult {
  draft: string
  usage: TokenUsage | null
  provider: string
  model: string
}

const DEFAULT_CATEGORY: TicketCategoryValue = TICKET_CATEGORY.GENERAL_INQUIRY
const DEFAULT_PRIORITY: TicketPriorityValue = TICKET_PRIORITY.MEDIUM

function usageFrom(message: BaseMessage): TokenUsage | null {
  const usage = (message as AIMessage).usage_metadata
  if (!usage) return null
  return {
    inputTokens: usage.input_tokens ?? 0,
    outputTokens: usage.output_tokens ?? 0,
    totalTokens: usage.total_tokens ?? 0,
  }
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}...`
}

function contentToText(content: BaseMessage['content']): string {
  if (typeof content === 'string') return content
  return content
    .map((part) => (typeof part === 'string' ? part : 'text' in part ? part.text : ''))
    .join('')
}

function defaultDraft(input: DraftInput): string {
  const bookLine = input.bookTitle ? ` regarding "${input.bookTitle}"` : ''
  const bullets = input.knowledge
    .flatMap((note) => note.split('\n').slice(1))
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((line) => `• ${line.replace(/^- /, '')}`)

  return [
    `Hi ${input.authorName},`,
    '',
    `Thank you for contacting Author Support about "${input.subject}"${bookLine}.`,
    '',
    `We've received your request and logged it under ${input.category}. Our team will review the details you shared and follow up within 24 business hours.`,
    '',
    ...(bullets.length > 0
      ? ['In the meantime, here is some helpful context:', '', ...bullets, '']
      : []),
    'If you have any additional details, reply to this ticket and we will include them in the review.',
    '',
    'Author Support',
  ].join('\n')
}

export class AIService {
  private readonly model: BaseChatModel | null
  private readonly knowledge: KnowledgeStore

  constructor() {
    this.knowledge = new KnowledgeStore()
    this.model = createModel()
  }

  get isEnabled(): boolean {
    return this.model !== null
  }

  getDefaultClassification(): ClassificationResult {
    return {
      category: DEFAULT_CATEGORY,
      priority: DEFAULT_PRIORITY,
      reasoning: 'Default classification (AI not configured)',
      usage: null,
    }
  }

  async classify(input: ClassifyInput): Promise<ClassificationResult> {
    if (!this.model) return this.getDefaultClassification()

    const structured = this.model.withStructuredOutput(classificationSchema, { includeRaw: true })
    const human = truncate(buildClassifyHuman(input), env.AI_MAX_INPUT_CHARS)

    const result = await structured.invoke([
      new SystemMessage(CLASSIFY_SYSTEM_PROMPT),
      new HumanMessage(human),
    ])

    const parsed = result.parsed
    return {
      category: parsed.category,
      priority: parsed.priority,
      reasoning: parsed.reasoning,
      usage: usageFrom(result.raw),
    }
  }

  async generateDraft(input: Omit<DraftInput, 'knowledge'>): Promise<DraftResult> {
    const query = `${input.subject}\n${input.description}`
    const knowledge = await this.knowledge.search(query, {
      category: input.category,
      k: 4,
    })

    const draftInput: DraftInput = { ...input, knowledge }

    if (!this.model) {
      return {
        draft: defaultDraft(draftInput),
        usage: null,
        provider: 'default',
        model: 'template',
      }
    }

    const human = truncate(buildDraftHuman(draftInput), env.AI_MAX_INPUT_CHARS * 2)
    const response = await this.model.invoke([
      new SystemMessage(DRAFT_SYSTEM_PROMPT),
      new HumanMessage(human),
    ])

    return {
      draft: contentToText(response.content).trim(),
      usage: usageFrom(response),
      provider: 'nvidia',
      model: env.AI_MODEL,
    }
  }
}
