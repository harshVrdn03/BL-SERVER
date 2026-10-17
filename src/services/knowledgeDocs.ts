import type { TicketCategory } from '../types/domain.js'

export interface KnowledgeDoc {
  id: string
  category: TicketCategory
  title: string
  content: string
}

export const KNOWLEDGE_DOCS: KnowledgeDoc[] = [
  {
    id: 'company-overview',
    category: 'General Inquiry',
    title: 'Company overview',
    content: `
      • The publisher is a self-publishing company operating in India and the US.
      • We offer publishing packages: Standard Free (no upfront cost) and Bestseller Breakthrough (premium, paid package with marketing and distribution add-ons).
      • We handle cover design, typesetting, ISBN assignment, printing, distribution, and royalty management for our authors.
      • Our in-house printing facility and warehouse are located in Delhi. We also work with print partners including Repro India and Epitome Books.`,
  },
  {
    id: 'royalty-policy',
    category: 'Royalty & Payments',
    title: 'Royalty policy',
    content: `
      • Publisher follows an 80/20 royalty split: 80% of the net profit per book goes to the author, 20% to Publisher.
      • Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges.
      • Royalties are calculated quarterly and paid within 45 days of the quarter ending.
      • Minimum payout threshold: ₹1,000. If accumulated royalties are below this, they roll over to the next quarter.
      • Payouts are made via bank transfer to the account linked in the author’s dashboard.
      • Authors can view a detailed royalty breakdown in their dashboard, showing sales figures per platform.`,
  },
  {
    id: 'isbn-policy',
    category: 'ISBN & Metadata Issues',
    title: 'ISBN policy',
    content: `
      • Every book published through Publisher receives a unique ISBN assigned by Publisher.
      • ISBNs are registered under Publisher's publisher imprint. If an author wants an ISBN under their own imprint, they need to obtain it independently.
      • If an author reports an ISBN error (duplicate, wrong book linked), it is treated as a high-priority issue and escalated to the production team for resolution.`,
  },
  {
    id: 'printing-quality',
    category: 'Printing & Quality',
    title: 'Printing and quality',
    content: `
      • In-house printing handles most orders. Overflow or specific format requirements go to Repro India
      or Epitome Books.
      • Standard print turnaround: 5–7 business days from order confirmation.
      • If an author reports a quality issue (misprints, binding defects, color inconsistency), Publisher
      arranges a free reprint after verification. The author may need to share photos of the defective copy.`,
  },
  {
    id: 'distribution',
    category: 'Distribution & Availability',
    title: 'Distribution and availability',
    content: `
      • Books are listed on Amazon India, Flipkart, Amazon US, Amazon UK, and the Publisher Store.
      • New listings typically go live within 7–10 business days after publication is complete.
      • If a book is showing as unavailable on a platform, it usually indicates a stock sync issue—
      Publisher’s team can trigger a re-sync within 24–48 hours.`,
  },
  {
    id: 'production-stages',
    category: 'Book Status & Production Updates',
    title: 'Production stages',
    content: `
      • A book goes through the following stages: Manuscript Received → Editing (if opted) → Cover
      Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup →
      Published & Live.
      • Authors are updated at each stage via email. Delays typically happen at Cover Design (waiting for
      author approval) and Proofreading (revision rounds).`,
  },
  {
    id: 'tone-guidelines',
    category: 'General Inquiry',
    title: 'Communication tone',
    content: `
      This is how Publisher communicates with authors. The AI-generated responses should match this tone:
      • Always empathetic and professional. Authors are our partners, not customers to be managed.
      • Acknowledge the author’s concern before jumping to solutions.
      • Be specific: include actual numbers, dates, and statuses wherever possible rather than vague
      reassurances.
      • If something is Publisher’s fault (delayed royalties, ISBN error), own it directly. No corporate
      deflection.
      • If the issue requires escalation or investigation, give a clear timeline (“Our team will look into this
      and get back to you within 48 hours”) rather than open-ended promises.
      • Always end with a clear next step for the author and/or the Publisher team.`,
  },
]
