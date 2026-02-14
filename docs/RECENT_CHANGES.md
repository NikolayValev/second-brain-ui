# Recent Frontend Changes

## Streaming Chat, Sync Routes & Backend Integration (February 2026)

This section documents the integration of 5 major backend features into the frontend: SSE streaming chat, conversation sync, auto-embed, pgvector, and updated config defaults.

### 9. SSE Streaming Chat

**Files:** `app/api/ask/route.ts`, `app/ask/page.tsx`

The `/ask` endpoint now supports Server-Sent Events (SSE) streaming. When `stream: true` is passed in the request body, the API route proxies the raw SSE stream from the Python backend to the client instead of returning JSON.

**SSE event types (in order of arrival):**

| Event type | Payload | Description |
|------------|---------|-------------|
| `source` | `{ path, title, snippet, score }` | One per relevant document, arrives before answer tokens |
| `token` | `{ token: "word" }` | Individual text tokens of the answer |
| `done` | `{ conversation_id: number }` | Signals stream completion |

**API route changes (`app/api/ask/route.ts`):**
- Added streaming proxy path: when `stream: true`, returns `new Response(response.body, ...)` with `text/event-stream` content type
- Added `X-API-Key` header to all backend requests (via `BRAIN_API_KEY` env var)
- Non-streaming path preserved as fallback (saves to Prisma)

**Chat page changes (`app/ask/page.tsx`):**
- `handleSubmit` replaced with streaming version using `ReadableStream`
- SSE parsing with proper line buffer handling for partial chunks
- Sources appear immediately as they arrive (before answer tokens)
- Tokens append incrementally for typewriter effect
- `isStreaming` state tracks active streaming for UI indicators
- After stream completes: fire-and-forget `POST /api/sync/conversations`, then refresh sidebar conversation list

### 10. Streaming-Aware Chat Message Component

**File:** `components/ChatMessage.tsx`

- New `isStreaming` prop — when true, shows a blinking cursor indicator
- Sources now render **before** content (visible during streaming before tokens arrive)
- "Thinking..." placeholder when streaming but no content has arrived yet
- `SourceData` union type supports both old (`file_path`/`file_title`) and new (`path`/`title`) field names for backward compatibility with stored conversations

### 11. Sync API Routes

**Files:** `app/api/sync/route.ts` (NEW), `app/api/sync/conversations/route.ts` (NEW)

Two new API routes proxy sync operations to the Python backend:

**`POST /api/sync`** — Trigger incremental or full sync
```json
{ "mode": "incremental" }  // or "full"
```

**`GET /api/sync?action=stats`** — Database statistics (file count, chunk count, embedding count, conversation count)

**`GET /api/sync?action=changes&since=<ISO-8601>`** — Poll for changes since a timestamp

**`POST /api/sync/conversations`** — Sync conversations from backend SQLite → PostgreSQL. Called automatically after each streamed chat response so the sidebar reflects new conversations.

### 12. Config Defaults Updated

**File:** `app/api/config/route.ts`

Fallback defaults updated to match current backend configuration:
- `model`: `'qwen3:30b'` (was `'llama3.2'`)
- `ragTechnique`: `'hybrid'` (was `'basic'`)

### 13. API Types Regenerated

**File:** `lib/api-types.ts`

Regenerated from the backend OpenAPI spec (`https://brain.nikolayvalev.com/openapi.json`). Key changes:
- `AskRequest` now includes `stream?: boolean` field
- `SourceInfo` renamed to `Source` (schema name change in backend)
- New sync-related endpoint types added
- Conversation and message types updated

### 14. Source Type Alignment

**Files:** `lib/api-client.ts`, `lib/types.ts`

- `SourceInfo` type in `api-client.ts` now maps to `components['schemas']['Source']`
- `Message.sources` in `types.ts` accepts `SourceInfo[] | Record<string, unknown>[] | null` for flexibility with different source formats stored in the database

---

## Summary of Changes (February 2026)

### 1. Next.js 16 Migration: Middleware → Proxy

**File:** `proxy.ts` (renamed from `middleware.ts`)

The `middleware` file convention is deprecated in Next.js 16. Renamed to `proxy` with updated exports.

```typescript
// Before
export default clerkMiddleware();

// After  
export const proxy = clerkMiddleware();
```

### 2. Route Protection with Clerk

**File:** `proxy.ts`

Added explicit route protection for authenticated-only pages:

```typescript
const isProtectedRoute = createRouteMatcher([
  '/ask(.*)',
  '/inbox(.*)',
  '/notes(.*)',
  '/search(.*)',
  '/conversations(.*)',
  '/api/ask(.*)',
  '/api/conversations(.*)',
  '/api/files(.*)',
  '/api/inbox(.*)',
  '/api/search(.*)',
  '/api/stats(.*)',
]);
```

Unauthenticated users are redirected to sign-in when accessing protected routes.

### 3. Landing Page for Signed-Out Users

**File:** `app/page.tsx`

- Homepage now shows a marketing landing page when not authenticated
- Features hero section, feature highlights, and sign-in CTAs
- Authenticated users see the normal dashboard

### 4. Inbox API Proxy Route

**File:** `app/api/inbox/route.ts` (NEW)

Created a Next.js API route to proxy inbox requests to the Python backend. This is necessary because:
- Client components can't access server-side environment variables (`PYTHON_API_URL`, `BRAIN_API_KEY`)
- The Python API requires authentication headers

**Endpoints:**
- `GET /api/inbox?action=contents` → proxies to `GET /inbox/contents`
- `GET /api/inbox?action=files` → proxies to `GET /inbox/files`
- `POST /api/inbox` → proxies to `POST /inbox/process`

### 5. Notes Page: Switched to Python API

**File:** `app/notes/[...path]/page.tsx`

Changed from querying Prisma database to fetching from Python API:

```typescript
// Before: Prisma query
const file = await prisma.file.findUnique({ where: { path } })

// After: Python API
const { data } = await api.GET('/file', { params: { query: { path } } })
```

This ensures notes display correctly even if the Prisma DB is out of sync.

**Backend endpoints used:**
- `GET /file?path=...` - Fetch file content
- `GET /backlinks?path=...` - Fetch files that link to this one

### 6. Dashboard Inbox Count from Python API

**File:** `app/page.tsx`

The inbox count badge now fetches from Python API (`/inbox/contents`) instead of Prisma database, ensuring consistency with the Inbox page.

### 7. URL Decoding for Note Paths

**File:** `app/notes/[...path]/page.tsx`

Added URL decoding for path segments to handle spaces and special characters:

```typescript
const filePath = path.map(segment => decodeURIComponent(segment)).join('/')
```

### 8. Build Process Updates

**File:** `package.json`

```json
"build": "npm run generate:api-types && prisma generate && next build"
```

Build now:
1. Regenerates API types from OpenAPI spec (ensures type safety with backend)
2. Generates Prisma client
3. Builds Next.js

---

## Backend API Alignment Needed

### Required Endpoints (Already Expected)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/file` | GET | Get file content by path |
| `/backlinks` | GET | Get files linking to a path |
| `/inbox/contents` | GET | Get inbox folder structure |
| `/inbox/files` | GET | Get flat list of inbox files |
| `/inbox/process` | POST | Process inbox files |

### Response Schema Requirements

#### `GET /file?path=...`

```json
{
  "path": "string",
  "title": "string", 
  "content": "string (full markdown content)",
  "tags": ["string"] // Optional but useful
}
```

#### `GET /backlinks?path=...`

```json
{
  "backlinks": [
    {
      "path": "string",
      "title": "string"
    }
  ]
}
```

#### `GET /inbox/contents`

```json
{
  "name": "string",
  "path": "string",
  "files": [...],
  "folders": [...]
}
```

### Potential Improvements

1. **Tags in `/file` response**: Currently the frontend expects `tags?: string[]` in the FileResponse. If not present, tags won't display on note pages.

2. **Created/Modified dates**: The frontend removed date display since the API doesn't provide `createdAt`/`modifiedAt`. Consider adding these fields.

3. **Backlinks response**: Ensure `/backlinks` returns `{ backlinks: [...] }` format, not a raw array.
