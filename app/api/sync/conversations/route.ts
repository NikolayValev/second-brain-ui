import { NextResponse } from 'next/server'

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000'
const BRAIN_API_KEY = process.env.BRAIN_API_KEY || ''

/**
 * POST /api/sync/conversations — sync conversations from backend SQLite → PostgreSQL
 * Lightweight endpoint — only syncs conversations and messages.
 */
export async function POST() {
  try {
    const headers: Record<string, string> = {}
    if (BRAIN_API_KEY) headers['X-API-Key'] = BRAIN_API_KEY

    const response = await fetch(`${PYTHON_API_URL}/sync/conversations`, {
      method: 'POST',
      headers,
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      return NextResponse.json({ error: errText }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Conversation sync error:', error)
    return NextResponse.json({ error: 'Conversation sync failed' }, { status: 500 })
  }
}
