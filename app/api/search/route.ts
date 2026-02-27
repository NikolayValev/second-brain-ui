import { NextRequest, NextResponse } from 'next/server'
import { buildBackendHeaders, buildBackendUrl, forwardBackendJson } from '@/lib/backend-proxy'

function parseLimit(raw: string | null, fallback: number): number {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.min(100, Math.max(1, Math.floor(parsed)))
}

export async function GET(req: NextRequest) {
  const query = (req.nextUrl.searchParams.get('q') || '').trim()
  const limit = parseLimit(req.nextUrl.searchParams.get('limit'), 20)

  if (!query) {
    return NextResponse.json({ detail: 'Query cannot be empty' }, { status: 400 })
  }

  try {
    const response = await fetch(
      buildBackendUrl('/search', { q: query, limit }),
      {
        method: 'GET',
        headers: buildBackendHeaders(),
        cache: 'no-store',
      }
    )

    return forwardBackendJson(response)
  } catch {
    return NextResponse.json(
      { detail: 'Backend unavailable. Could not run full-text search.' },
      { status: 503 }
    )
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    query?: string
    limit?: number
    rag_technique?: string
    ragTechnique?: string
  } | null

  const query = body?.query?.trim() || ''
  const limit = parseLimit(typeof body?.limit === 'number' ? String(body.limit) : null, 10)
  const ragTechnique = body?.rag_technique || body?.ragTechnique || 'hybrid'

  if (!query) {
    return NextResponse.json({ detail: 'Query cannot be empty' }, { status: 400 })
  }

  try {
    const response = await fetch(buildBackendUrl('/search'), {
      method: 'POST',
      headers: buildBackendHeaders(),
      body: JSON.stringify({
        query,
        limit,
        rag_technique: ragTechnique,
      }),
      cache: 'no-store',
    })

    return forwardBackendJson(response)
  } catch {
    return NextResponse.json(
      { detail: 'Backend unavailable. Could not run semantic search.' },
      { status: 503 }
    )
  }
}
