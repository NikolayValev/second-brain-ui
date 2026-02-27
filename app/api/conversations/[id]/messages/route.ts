import { NextRequest, NextResponse } from 'next/server'
import { buildBackendHeaders, buildBackendUrl, forwardBackendJson } from '@/lib/backend-proxy'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const conversationId = Number(id)

  if (!Number.isFinite(conversationId) || conversationId <= 0) {
    return NextResponse.json({ detail: 'Invalid conversation ID' }, { status: 400 })
  }

  const body = await req.json().catch(() => null) as {
    role?: string
    content?: string
  } | null

  if (!body?.content || !body?.role) {
    return NextResponse.json({ detail: 'Both role and content are required' }, { status: 400 })
  }

  try {
    const response = await fetch(
      buildBackendUrl(`/conversations/${Math.floor(conversationId)}/messages`),
      {
        method: 'POST',
        headers: buildBackendHeaders(),
        body: JSON.stringify({
          role: body.role,
          content: body.content,
        }),
        cache: 'no-store',
      }
    )

    return forwardBackendJson(response)
  } catch {
    return NextResponse.json(
      { detail: 'Backend unavailable. Could not append message.' },
      { status: 503 }
    )
  }
}
