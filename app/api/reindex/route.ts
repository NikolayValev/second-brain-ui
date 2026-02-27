import { NextRequest, NextResponse } from 'next/server'
import { buildBackendHeaders, buildBackendUrl, forwardBackendJson } from '@/lib/backend-proxy'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    full?: boolean
  } | null

  try {
    const response = await fetch(buildBackendUrl('/reindex'), {
      method: 'POST',
      headers: buildBackendHeaders(),
      body: JSON.stringify({
        full: body?.full ?? false,
      }),
      cache: 'no-store',
    })

    return forwardBackendJson(response)
  } catch {
    return NextResponse.json(
      { detail: 'Backend unavailable. Could not trigger /reindex.' },
      { status: 503 }
    )
  }
}
