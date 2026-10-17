import { TICKET_CATEGORIES, TICKET_PRIORITIES, type TicketCategory } from '../types/domain.js'

export interface ClassifyInput {
  subject: string
  description: string
  bookTitle?: string | null
}

export interface DraftInput {
  authorName: string
  subject: string
  description: string
  category: TicketCategory
  bookTitle?: string | null
  conversation?: string
  knowledge: string[]
}

export const CLASSIFY_SYSTEM_PROMPT = `You are the publisher's support triage assistant.
You classify incoming author support tickets and assign a priority.

Choose exactly one category from:
${TICKET_CATEGORIES.map((category) => `- ${category}`).join('\n')}

Choose exactly one priority from:
- Critical: payments blocked or missing, author cannot access account, legal/compliance risk, or data loss.
- High: significant issue affecting sales/visibility or money, time-sensitive.
- Medium: important but not urgent; needs attention within a few business days.
- Low: general questions, minor requests, information only.

Base your decision only on the ticket content. Never invent facts.`

export const DRAFT_SYSTEM_PROMPT = `You are the publisher's author support agent.
Write a warm, professional reply to the author's support ticket.

Rules:
- Start with "Hi {author name}," using the provided author name.
- Use ONLY the retrieved knowledge notes. If they do not cover the question, say a specialist will follow up; do not invent policies, amounts or dates.
- Keep it concise (120-220 words), friendly and specific to the author's book when provided.
- Acknowledge the concern first, then give a clear next step.
- Sign off as "Author Support".
- Do not mention that you are an AI.`

export function buildClassifyHuman(input: ClassifyInput): string {
  const lines = [`Subject: ${input.subject}`, `Description: ${input.description}`]
  if (input.bookTitle) lines.push(`Book: ${input.bookTitle}`)
  return lines.join('\n')
}

export function buildDraftHuman(input: DraftInput): string {
  const lines = [
    `Author name: ${input.authorName}`,
    `Subject: ${input.subject}`,
    `Description: ${input.description}`,
    `Category: ${input.category}`,
  ]
  if (input.bookTitle) lines.push(`Book: ${input.bookTitle}`)
  if (input.conversation) lines.push(`Conversation so far:\n${input.conversation}`)
  lines.push('', 'Retrieved knowledge notes:')
  if (input.knowledge.length === 0) {
    lines.push('(No knowledge snippets retrieved — ask for details and promise a 24h follow-up.)')
  } else {
    for (const [index, note] of input.knowledge.entries()) {
      lines.push(`--- Note ${index + 1} ---`, note)
    }
  }
  return lines.join('\n')
}
