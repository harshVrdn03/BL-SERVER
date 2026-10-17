CREATE TABLE IF NOT EXISTS authors (
  author_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  city TEXT,
  joined_date DATE
);

CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL UNIQUE,
  author_id TEXT NOT NULL REFERENCES authors(author_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  isbn TEXT,
  genre TEXT,
  publication_date DATE,
  status TEXT NOT NULL,
  mrp INTEGER,
  author_royalty_per_copy INTEGER,
  total_copies_sold INTEGER NOT NULL DEFAULT 0,
  total_royalty_earned INTEGER NOT NULL DEFAULT 0,
  royalty_paid INTEGER NOT NULL DEFAULT 0,
  royalty_pending INTEGER NOT NULL DEFAULT 0,
  last_royalty_payout_date DATE,
  print_partner TEXT,
  available_on JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('author', 'admin')),
  author_id TEXT REFERENCES authors(author_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS ticket_number_seq;

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE DEFAULT ('BL-' || lpad(nextval('ticket_number_seq')::text, 4, '0')),
  author_id TEXT NOT NULL REFERENCES authors(author_id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  category TEXT NOT NULL DEFAULT 'General Inquiry',
  ai_category TEXT,
  category_overridden BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'Medium',
  ai_priority TEXT,
  priority_overridden BOOLEAN NOT NULL DEFAULT false,
  ai_status TEXT NOT NULL DEFAULT 'pending',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('author', 'admin')),
  sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_books_author ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_tickets_author ON tickets(author_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);
