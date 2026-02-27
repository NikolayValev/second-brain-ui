import { NextRequest, NextResponse } from 'next/server'
import { buildBackendHeaders, buildBackendUrl, forwardBackendJson } from '@/lib/backend-proxy'

function parseLimit(raw: string | null): number {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) {
    return 20
  }

  return Math.min(100, Math.max(1, Math.floor(parsed)))
}

function parseConversationId(raw: string | null): number | null {
  if (!raw) {
    return null
  }

  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return Math.floor(parsed)
}

export async function GET(req: NextRequest) {
  const idParam = req.nextUrl.searchParams.get('id')
  const conversationId = parseConversationId(idParam)

  if (idParam && conversationId === null) {
    return NextResponse.json({ detail: 'Invalid conversation ID' }, { status: 400 })
  }

  try {
    if (conversationId !== null) {
      const response = await fetch(
        buildBackendUrl(`/conversations/${conversationId}`),
        {
          method: 'GET',
          headers: buildBackendHeaders(),
          cache: 'no-store',
        }
      )
      return forwardBackendJson(response)
    }

    const sessionId =
      req.nextUrl.searchParams.get('session_id') ||
      req.nextUrl.searchParams.get('sessionId') ||
      undefined
    const limit = parseLimit(req.nextUrl.searchParams.get('limit'))

    const response = await fetch(
      buildBackendUrl('/conversations', { session_id: sessionId, limit }),
      {
        method: 'GET',
        headers: buildBackendHeaders(),
        cache: 'no-store',
      }
    )
    return forwardBackendJson(response)
  } catch {
    return NextResponse.json(
      { detail: 'Backend unavailable. Could not fetch conversations.' },
      { status: 503 }
    )
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    session_id?: string | null
    sessionId?: string | null
    title?: string | null
    system_prompt?: string | null
    systemPrompt?: string | null
  } | null

  try {
    const response = await fetch(buildBackendUrl('/conversations'), {
      method: 'POST',
      headers: buildBackendHeaders(),
      body: JSON.stringify({
        session_id: body?.session_id ?? body?.sessionId ?? undefined,
        title: body?.title ?? undefined,
        system_prompt: body?.system_prompt ?? body?.systemPrompt ?? undefined,
      }),
      cache: 'no-store',
    })

    return forwardBackendJson(response)
  } catch {
    return NextResponse.json(
      { detail: 'Backend unavailable. Could not create conversation.' },
      { status: 503 }
    )
  }
}

export async function DELETE() {
  return NextResponse.json(
    { detail: 'Conversation deletion is not supported by the current backend API.' },
    { status: 405 }
  )
}
