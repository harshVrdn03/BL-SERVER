import { z } from 'zod'
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from '../types/domain.js'

export const createTicketSchema = z.object({
  bookId: z
    .union([z.uuid('Invalid book reference'), z.literal(''), z.null()])
    .optional()
    .transform((value) => (value ? value : null)),
  subject: z
    .string()
    .trim()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be 200 characters or fewer'),
  description: z
    .string()
    .trim()
    .min(20, 'Please describe your query in at least 20 characters')
    .max(4000, 'Description must be 4000 characters or fewer'),
  attachmentUrl: z
    .union([z.url('Enter a valid URL'), z.literal(''), z.null()])
    .optional()
    .transform((value) => (value ? value : null)),
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>

export const postMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(8000, 'Message must be 8000 characters or fewer'),
})

export const adminTicketQuerySchema = z.object({
  status: z.enum(TICKET_STATUSES).optional(),
  category: z.enum(TICKET_CATEGORIES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  assignedToMe: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().trim().min(1).max(200).optional(),
  sort: z.enum(['oldest', 'newest', 'priority']).optional(),
})

export type AdminTicketQuery = z.infer<typeof adminTicketQuerySchema>

export const adminUpdateTicketSchema = z
  .object({
    status: z.enum(TICKET_STATUSES).optional(),
    category: z.enum(TICKET_CATEGORIES).optional(),
    priority: z.enum(TICKET_PRIORITIES).optional(),
    assignedToUserId: z.union([z.uuid(), z.null()]).optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Provide at least one field to update',
  })

export type AdminUpdateTicketInput = z.infer<typeof adminUpdateTicketSchema>

export const adminPostMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(8000, 'Message must be 8000 characters or fewer'),
  isInternal: z.boolean().optional().default(false),
})

export type AdminPostMessageInput = z.infer<typeof adminPostMessageSchema>
