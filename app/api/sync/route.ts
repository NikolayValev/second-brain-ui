import { NextRequest, NextResponse } from 'next/server'

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000'
const BRAIN_API_KEY = process.env.BRAIN_API_KEY || ''

function getHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (BRAIN_API_KEY) h['X-API-Key'] = BRAIN_API_KEY
  return h
}

/**
 * POST /api/sync — trigger incremental or full sync
 * Body: { mode: "incremental" | "full" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const mode = body.mode || 'incremental'

    const response = await fetch(`${PYTHON_API_URL}/sync`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ mode }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      return NextResponse.json({ error: errText }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

/**
 * GET /api/sync?action=stats        — get sync statistics
 * GET /api/sync?action=changes&since=ISO — check for changes since timestamp
 */
export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action') || 'stats'
    const since = req.nextUrl.searchParams.get('since')

    let url: string
    if (action === 'changes' && since) {
      url = `${PYTHON_API_URL}/sync/changes?since=${encodeURIComponent(since)}`
    } else {
      url = `${PYTHON_API_URL}/sync/stats`
    }

    const response = await fetch(url, {
      headers: getHeaders(),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      return NextResponse.json({ error: errText }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Sync GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch sync data' }, { status: 500 })
  }
}
