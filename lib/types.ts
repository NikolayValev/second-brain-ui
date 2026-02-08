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
  sources: Source[] | null
  createdAt: Date
}

export interface Source {
  path: string
  title: string
  snippet?: string
  score?: number
}

export interface DashboardStats {
  totalFiles: number
  totalSections: number
  totalTags: number
  inboxCount: number
}

export interface SearchResult {
  id: number
  path: string
  title: string | null
  snippet: string
  tags: string[]
  modifiedAt: Date
}

// Inbox File Browser Types
export interface InboxFileInfo {
  name: string
  path: string
  size_bytes: number
  modified: string
  type: "file"
}

export interface InboxFolderInfo {
  name: string
  path: string
  type: "folder"
  files: InboxFileInfo[]
  folders: InboxFolderInfo[]
}

export interface InboxContentsResponse {
  inbox_path: string
  total_files: number
  total_folders: number
  root_files: InboxFileInfo[]
  folders: InboxFolderInfo[]
}

export interface InboxProcessResponse {
  message: string
  processed_count: number
}
