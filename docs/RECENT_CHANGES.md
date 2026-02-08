# Recent Frontend Changes

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
