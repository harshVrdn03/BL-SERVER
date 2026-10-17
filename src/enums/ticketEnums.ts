export const TICKET_STATUS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
} as const;

export type TicketStatusKey = keyof typeof TICKET_STATUS;
export type TicketStatusValue = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

export const TICKET_PRIORITY = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
} as const;

export type TicketPriorityKey = keyof typeof TICKET_PRIORITY;
export type TicketPriorityValue = (typeof TICKET_PRIORITY)[keyof typeof TICKET_PRIORITY];

export const TICKET_CATEGORY = {
  ROYALTY_PAYMENTS: 'Royalty & Payments',
  ISBN_METADATA: 'ISBN & Metadata Issues',
  PRINTING_QUALITY: 'Printing & Quality',
  DISTRIBUTION_AVAILABILITY: 'Distribution & Availability',
  BOOK_STATUS_PRODUCTION: 'Book Status & Production Updates',
  GENERAL_INQUIRY: 'General Inquiry',
} as const;

export type TicketCategoryKey = keyof typeof TICKET_CATEGORY;
export type TicketCategoryValue = (typeof TICKET_CATEGORY)[keyof typeof TICKET_CATEGORY];
