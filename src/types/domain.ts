export type Role = 'author' | 'admin'

export const TICKET_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'] as const
export type TicketStatus = (typeof TICKET_STATUSES)[number]

export const TICKET_CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
] as const
export type TicketCategory = (typeof TICKET_CATEGORIES)[number]

export const TICKET_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const
export type TicketPriority = (typeof TICKET_PRIORITIES)[number]

export interface AuthContext {
  userId: string
  role: Role
  authorId: string | null
}
