import { NextRequest, NextResponse } from 'next/server'
import { buildBackendHeaders, buildBackendUrl, forwardBackendJson } from '@/lib/backend-proxy'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    paths?: string[] | null
    force?: boolean
  } | null

  try {
    const response = await fetch(buildBackendUrl('/index'), {
      method: 'POST',
      headers: buildBackendHeaders(),
      body: JSON.stringify({
        paths: body?.paths ?? null,
        force: body?.force ?? false,
      }),
      cache: 'no-store',
    })

    return forwardBackendJson(response)
  } catch {
    return NextResponse.json(
      { detail: 'Backend unavailable. Could not trigger /index.' },
      { status: 503 }
    )
  }
}
