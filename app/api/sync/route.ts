import { NextRequest, NextResponse } from 'next/server'
import { buildBackendHeaders, buildBackendUrl, forwardBackendJson } from '@/lib/backend-proxy'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as {
    mode?: string
  }
  const mode = body.mode === 'full' ? 'full' : 'incremental'

  try {
    const response = await fetch(buildBackendUrl('/sync'), {
      method: 'POST',
      headers: buildBackendHeaders(),
      body: JSON.stringify({ mode }),
      cache: 'no-store',
    })

    return forwardBackendJson(response)
  } catch {
    return NextResponse.json(
      { detail: 'Backend unavailable. Could not trigger /sync.' },
      { status: 503 }
    )
  }
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action') || 'stats'
  const since = req.nextUrl.searchParams.get('since')

  const path = action === 'changes' ? '/sync/changes' : '/sync/stats'
  const query = action === 'changes' ? { since: since || undefined } : undefined

  try {
    const response = await fetch(buildBackendUrl(path, query), {
      method: 'GET',
      headers: buildBackendHeaders(),
      cache: 'no-store',
    })

    return forwardBackendJson(response)
  } catch {
    return NextResponse.json(
      { detail: `Backend unavailable. Could not fetch ${path}.` },
      { status: 503 }
    )
  }
}
