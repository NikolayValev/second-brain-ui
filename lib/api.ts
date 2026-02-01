const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000'

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
