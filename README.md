# Author Support & Communication Portal

An author support portal where authors can view their books, submit support tickets, and communicate with the publishing team. Admins can manage tickets, assign them, reply, and generate AI-assisted draft replies.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, React Query, Axios, Zod
- **Backend:** Node.js, Express, TypeScript, Kysely, PostgreSQL (Neon) with pgvector, LangChain (OpenAI/NVIDIA NIM)
- **Auth:** JWT (Bearer tokens)

## Setup

### 1. Clone and install

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```



### 2. Environment

Create `server/.env` (use `.env.example` as reference):

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://<user>:<pass>@<host>/neondb?sslmode=require
JWT_SECRET=<long-random-string>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info

AI_ENABLED=true
AI_MODEL=nvidia/nemotron-3-super-120b-a12b
EMBEDDING_MODEL=nvidia/nemotron-3-embed-1b
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_API_KEY=<your-nvidia-key>
```



### 3. Database

```bash
cd server
npm run db:migrate         # Run migrations
npm run db:seed            # Seed sample authors/books/users
npm run db:seed-knowledge  # Seed knowledge base for RAG
npm run db:clear           # Drop all tables + recreate empty schema (no seed data)
npm run db:reset           # Drop all tables + recreate schema + seed sample + knowledge data
```



### 4. Run

```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

App: [http://localhost:5173](http://localhost:5173) | API: [http://localhost:4000](http://localhost:4000)

## API Reference

Base URL: `http://localhost:4000/api`

Auth: Bearer token in `Authorization: Bearer <token>` header.

### Auth



#### POST /auth/login

**Request**

```json
{"email": "string", "password": "string"}
```

**Response (200 OK)**

```json
{
  "data": {
    "token": "jwt",
    "user": {"id": "uuid", "email": "string", "role": "author|admin", "author": null | {...}}
  }
}
```



#### GET /auth/me

**Request**: headers with Bearer token
**Response (200 OK)**

```json
{"data": {"id": "uuid", "email": "string", "role": "author|admin", "author": null | {...}}}
```



### Health



#### GET /health

**Request**: none
**Response (200 OK)**

```json
{"data": {"status": "ok", "aiEnabled": true}}
```



### Author Endpoints (role: author)



#### GET /books

**Request**: Bearer token
**Response (200 OK)**

```json
{"data": [{"id": "uuid", "bookId": "string", "title": "string", "isbn": null, "genre": null, "publicationDate": null, "status": "string", "mrp": null, "authorRoyaltyPerCopy": null, "totalCopiesSold": 0, "totalRoyaltyEarned": 0, "royaltyPaid": 0, "royaltyPending": 0, "lastRoyaltyPayoutDate": null, "printPartner": null, "availableOn": []}]}
```



#### GET /books/:bookId

**Request**: Bearer token
**Response (200 OK)**: single book object (as above)

#### GET /tickets

**Request**: Bearer token
**Response (200 OK)**

```json
{"data": [{"id": "uuid", "ticketNumber": "BL-0001", "authorId": "uuid", "authorName": "string", "authorEmail": "string", "bookId": null, "bookTitle": null, "subject": "string", "description": "string", "attachmentUrl": null, "status": "Open|In Progress|Resolved|Closed", "category": "string", "aiCategory": null, "categoryOverridden": false, "priority": "Low|Medium|High|Critical", "aiPriority": null, "priorityOverridden": false, "aiStatus": "pending|ok|failed", "assignedTo": null, "createdAt": "ISO8601", "updatedAt": "ISO8601", "resolvedAt": null, "messages": []}]}
```



#### POST /tickets

**Request**

```json
{"bookId": "uuid|null", "subject": "string (5-200 chars)", "description": "string (20-4000 chars)", "attachmentUrl": "url|null (optional)"}
```

**Response (201 Created)**: ticket object

#### GET /tickets/:ticketId

**Request**: Bearer token
**Response (200 OK)**: ticket object with `messages` (non-internal only for authors)

#### POST /tickets/:ticketId/messages

**Request**

```json
{"body": "string (1-8000 chars)"}
```

**Response (201 Created)**: message object

### Admin Endpoints (role: admin)



#### GET /admin/tickets

**Query params**: `status`, `category`, `priority`, `assignedToMe` (true/false), `q`, `from` (ISO8601), `to` (ISO8601), `sort` (oldest|newest|priority)
**Request**: Bearer token
**Response (200 OK)**

```json
{"data": [{"id": "uuid", "ticketNumber": "BL-0001", "authorName": "string", "bookTitle": null, "subject": "string", "status": "Open|In Progress|Resolved|Closed", "category": "string", "priority": "Low|Medium|High|Critical", "aiStatus": "pending|ok|failed", "assignedTo": {"id": "uuid", "name": "string"}|null, "createdAt": "ISO8601", "updatedAt": "ISO8601"}]}
```



#### GET /admin/tickets/:ticketId

**Request**: Bearer token
**Response (200 OK)**: full ticket object including internal messages

#### PATCH /admin/tickets/:ticketId

**Request**

```json
{"status": "Open|In Progress|Resolved|Closed", "category": "string", "priority": "Low|Medium|High|Critical", "assignedToUserId": "uuid|null"}
```

**Response (200 OK)**: updated ticket

#### POST /admin/tickets/:ticketId/assign

**Request**: empty body
**Response (200 OK)**: updated ticket

#### POST /admin/tickets/:ticketId/messages

**Request**

```json
{"body": "string (1-8000 chars)", "isInternal": true|false (optional, default false)}
```

**Response (201 Created)**: message object

#### POST /admin/tickets/:ticketId/ai/draft

**Request**: empty body
**Response (200 OK)**

```json
{"data": {"draft": "string", "generatedAt": "ISO8601", "provider": "nvidia", "model": "string", "tokensUsed": number|null}}
```



#### GET /admin/stats

**Request**: Bearer token
**Response (200 OK)**

```json
{"data": {"total": 0, "open": 0, "inProgress": 0, "resolved": 0, "closed": 0, "byCategory": {}, "byPriority": {}}}
```



### Realtime [Socket.IO](http://Socket.IO)

- Events: `created`, `updated`, `message` (emitted to admin room and author room)
- Payload: `{"ticketId": "uuid", "authorId": "uuid", "status": "string", "at": "ISO8601"}`

