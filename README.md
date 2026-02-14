# Second Brain UI

A mobile-first web interface for querying and managing the Second Brain knowledge base. Built with Next.js 16, Clerk auth, Prisma, and shadcn/ui.

## Features

- 📊 **Dashboard** - Overview with stats, recent notes, and quick actions
- 🔍 **Search** - Full-text search with tag filtering
- 💬 **Ask/Chat** - RAG-powered Q&A with **SSE streaming** and conversation history
- 📄 **Note Viewer** - Markdown rendering with backlinks
- 📥 **Inbox** - Pending items management
- 🔄 **Data Sync** - Automatic conversation sync between backend SQLite and PostgreSQL
- 🔐 **Authentication** - Clerk-based auth with route protection

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Auth**: Clerk
- **Database**: PostgreSQL via Prisma ORM
- **API Client**: openapi-fetch (type-safe, generated from OpenAPI spec)
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **Markdown**: react-markdown + remark-gfm

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (synced from Python backend)
- (Optional) Python backend running for RAG functionality

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/second-brain-ui.git
cd second-brain-ui
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your database URL
```

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
second-brain-ui/
├── app/
│   ├── layout.tsx           # Root layout with navigation
│   ├── page.tsx             # Dashboard
│   ├── search/page.tsx      # Search interface
│   ├── ask/page.tsx         # Chat/Q&A interface
│   ├── inbox/page.tsx       # Inbox list
│   ├── notes/[...path]/     # Note viewer
│   ├── conversations/[id]/  # Conversation detail
│   └── api/                 # API routes
│       ├── search/route.ts
│       ├── ask/route.ts
│       ├── files/route.ts
│       ├── stats/route.ts
│       └── conversations/route.ts
├── components/
│   ├── ui/                  # shadcn components
│   ├── Navigation.tsx
│   ├── SearchBar.tsx
│   ├── NoteCard.tsx
│   ├── ChatMessage.tsx
│   ├── TagPill.tsx
│   └── MarkdownRenderer.tsx
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   ├── api.ts              # Python backend client
│   ├── types.ts            # TypeScript types
│   ├── format.ts           # Date formatting utilities
│   └── utils.ts            # shadcn utilities
├── prisma/
│   └── schema.prisma       # Database schema
└── public/
    └── manifest.json       # PWA manifest
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search` | GET | Full-text search with tag filtering |
| `/api/ask` | POST | RAG Q&A — supports JSON response or SSE streaming (`stream: true`) |
| `/api/files` | GET | List files or get file by path |
| `/api/stats` | GET | Dashboard statistics |
| `/api/config` | GET | Backend configuration (providers, models, RAG techniques) |
| `/api/conversations` | GET/POST/DELETE | Conversation CRUD via Prisma |
| `/api/inbox` | GET/POST | Inbox file listing and processing |
| `/api/sync` | POST/GET | Trigger sync or get sync stats/changes |
| `/api/sync/conversations` | POST | Sync conversations from backend SQLite → PostgreSQL |

### Streaming Chat Flow

```
Client                   Next.js API Route             Python Backend
  │                            │                            │
  │── POST /api/ask ──────────>│                            │
  │   { stream: true }        │── POST /ask ───────────────>│
  │                            │   + X-API-Key header       │
  │                            │<── SSE stream ─────────────│
  │<── SSE stream ─────────────│                            │
  │  data: {type:"source",...} │                            │
  │  data: {type:"token",...}  │                            │
  │  data: {type:"done",...}   │                            │
  │                            │                            │
  │── POST /api/sync/conv ────>│── POST /sync/conversations>│
  │   (fire-and-forget)        │   (sync to PostgreSQL)     │
  │                            │                            │
  │── GET /api/conversations ─>│                            │
  │   (refresh sidebar)        │   (Prisma query)           │
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PYTHON_API_URL` | Python backend URL for RAG (default: `http://localhost:8000`) |
| `BRAIN_API_KEY` | API key for authenticating with the Python backend |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Docker

```bash
docker build -t second-brain-ui .
docker run -p 3000:3000 --env-file .env.local second-brain-ui
```

## Future Enhancements

- [ ] PWA with offline support
- [ ] Create new notes from web
- [ ] Graph visualization
- [ ] Keyboard shortcuts
- [ ] Periodic background sync polling (every 60s)
- [ ] Dashboard stats for embeddings and conversations
- [ ] pgvector-powered "similar notes" sidebar

## License

MIT
