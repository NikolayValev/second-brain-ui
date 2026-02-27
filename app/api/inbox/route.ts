import { NextRequest, NextResponse } from 'next/server'
import { buildBackendHeaders, buildBackendUrl, forwardBackendJson } from '@/lib/backend-proxy'

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action') || 'contents'
  const backendPath = action === 'files' ? '/inbox/files' : action === 'contents' ? '/inbox/contents' : null

  if (!backendPath) {
    return NextResponse.json({ detail: 'Invalid inbox action' }, { status: 400 })
  }

  try {
    const response = await fetch(buildBackendUrl(backendPath), {
      method: 'GET',
      headers: buildBackendHeaders(),
      cache: 'no-store',
    })

    return forwardBackendJson(response)
  } catch {
    return NextResponse.json(
      { detail: 'Backend unavailable. Could not fetch inbox data.' },
      { status: 503 }
    )
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    dry_run?: boolean
  } | null

  try {
    const response = await fetch(buildBackendUrl('/inbox/process'), {
      method: 'POST',
      headers: buildBackendHeaders(),
      body: JSON.stringify({
        dry_run: body?.dry_run ?? false,
      }),
      cache: 'no-store',
    })

    return forwardBackendJson(response)
  } catch {
    return NextResponse.json(
      { detail: 'Backend unavailable. Could not process inbox.' },
      { status: 503 }
    )
  }
}
