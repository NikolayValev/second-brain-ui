const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000'

import type { InboxContentsResponse, InboxFileInfo, InboxProcessResponse } from './types'

export interface AskRequest {
  question: string
  conversationId?: string
  sessionId?: string
}

export interface AskResponse {
  answer: string
  sources: Array<{
    path: string
    title: string
    snippet: string
    score: number
  }>
  conversationId: string
}

export interface Source {
  path: string
  title: string
  snippet: string
  score: number
}

export async function askQuestion(request: AskRequest): Promise<AskResponse> {
  const response = await fetch(`${PYTHON_API_URL}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}

export async function searchSemantic(query: string, limit: number = 10) {
  const response = await fetch(`${PYTHON_API_URL}/search?q=${encodeURIComponent(query)}&limit=${limit}`)
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}

// Inbox API functions
export async function getInboxContents(): Promise<InboxContentsResponse> {
  const response = await fetch(`${PYTHON_API_URL}/inbox/contents`, {
    cache: 'no-store',
  })

  if (response.status === 404) {
    throw new Error('Inbox folder not found')
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}

export async function getInboxFiles(): Promise<InboxFileInfo[]> {
  const response = await fetch(`${PYTHON_API_URL}/inbox/files`, {
    cache: 'no-store',
  })

  if (response.status === 404) {
    throw new Error('Inbox folder not found')
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}

export async function processInbox(): Promise<InboxProcessResponse> {
  const response = await fetch(`${PYTHON_API_URL}/inbox/process`, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}
