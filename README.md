# Second Brain UI

A mobile-first web interface for querying and managing the Second Brain knowledge base. Built with Next.js 14, Prisma, and shadcn/ui.

## Features

- 📊 **Dashboard** - Overview with stats, recent notes, and quick actions
- 🔍 **Search** - Full-text search with tag filtering
- 💬 **Ask/Chat** - RAG-powered Q&A with conversation history
- 📄 **Note Viewer** - Markdown rendering with backlinks
- 📥 **Inbox** - Pending items management

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL via Prisma ORM
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
| `/api/ask` | POST | RAG Q&A (proxies to Python backend) |
| `/api/files` | GET | List files or get file by path |
| `/api/stats` | GET | Dashboard statistics |
| `/api/conversations` | GET/POST/DELETE | Conversation CRUD |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PYTHON_API_URL` | Python backend URL for RAG (default: http://localhost:8000) |

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

- [ ] Clerk authentication
- [ ] PWA with offline support
- [ ] Trigger inbox processing from UI
- [ ] Create new notes from web
- [ ] Graph visualization
- [ ] Dark mode toggle
- [ ] Keyboard shortcuts

## License

MIT
