// Re-export API types from api-client (which wraps the generated OpenAPI types)
export type {
  SourceInfo,
  InboxFileInfo,
  InboxFolderInfo,
  InboxContentsResponse,
  InboxProcessResponse,
  SemanticSearchResult,
  SemanticSearchResponse,
} from './api-client';

// Alias SourceInfo as Source for backward compatibility
export type { SourceInfo as Source } from './api-client';

// Rename Python API SearchResult to avoid conflict with local DB SearchResult
export type { SemanticSearchResult as PythonSearchResult } from './api-client';

// Database/Prisma types (not from Python API)
export interface FileWithRelations {
  id: number
  path: string
  title: string | null
  contentHash: string | null
  frontmatter: Record<string, unknown> | null
  createdAt: Date
  modifiedAt: Date
  sections: Section[]
  tags: FileTagWithTag[]
}

export interface Section {
  id: number
  fileId: number
  heading: string
  level: number
  content: string
}

export interface Tag {
  id: number
  name: string
}

export interface FileTagWithTag {
  fileId: number
  tagId: number
  tag: Tag
}

export interface ConversationWithMessages {
  id: string
  sessionId: string
  title: string | null
  createdAt: Date
  updatedAt: Date
  messages: Message[]
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  sources: import('./api-client').SourceInfo[] | Record<string, unknown>[] | null
  createdAt: Date
}

export interface DashboardStats {
  totalFiles: number
  totalSections: number
  totalTags: number
  inboxCount: number
}

// Local DB SearchResult (from Next.js /api/search route, not Python API)
export interface SearchResult {
  id: number
  path: string
  title: string | null
  snippet: string
  tags: string[]
  modifiedAt: Date
}
