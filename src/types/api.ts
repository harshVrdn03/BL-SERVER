export interface BookDTO {
  id: string
  bookId: string
  title: string
  isbn: string | null
  genre: string | null
  publicationDate: string | null
  status: string
  mrp: number | null
  authorRoyaltyPerCopy: number | null
  totalCopiesSold: number
  totalRoyaltyEarned: number
  royaltyPaid: number
  royaltyPending: number
  lastRoyaltyPayoutDate: string | null
  printPartner: string | null
  availableOn: string[]
}

export interface TicketMessageDTO {
  id: string
  ticketId: string
  senderType: 'author' | 'admin'
  senderName: string
  body: string
  isInternal: boolean
  createdAt: string
}

export interface TicketDTO {
  id: string
  ticketNumber: string
  authorId: string
  authorName: string
  authorEmail: string
  bookId: string | null
  bookTitle: string | null
  subject: string
  description: string
  attachmentUrl: string | null
  status: string
  category: string
  aiCategory: string | null
  categoryOverridden: boolean
  priority: string
  aiPriority: string | null
  priorityOverridden: boolean
  aiStatus: string
  assignedTo: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  messages?: TicketMessageDTO[]
}

export interface TicketSummaryDTO {
  id: string
  ticketNumber: string
  authorName: string
  bookTitle: string | null
  subject: string
  status: string
  category: string
  priority: string
  aiStatus: string
  assignedTo: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
}

export interface AiDraftDTO {
  draft: string
  generatedAt: string
  provider: string
  model: string
  tokensUsed: number | null
}

export interface AdminStatsDTO {
  total: number
  open: number
  inProgress: number
  resolved: number
  closed: number
  byCategory: Record<string, number>
  byPriority: Record<string, number>
}
