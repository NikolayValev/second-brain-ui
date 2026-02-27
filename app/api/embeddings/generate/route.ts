import { NextRequest, NextResponse } from 'next/server'
import { buildBackendHeaders, buildBackendUrl, forwardBackendJson } from '@/lib/backend-proxy'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    limit?: number
  } | null

  try {
    const response = await fetch(buildBackendUrl('/embeddings/generate'), {
      method: 'POST',
      headers: buildBackendHeaders(),
      body: JSON.stringify({
        limit: body?.limit ?? 100,
      }),
      cache: 'no-store',
    })

    return forwardBackendJson(response)
  } catch {
    return NextResponse.json(
      { detail: 'Backend unavailable. Could not trigger /embeddings/generate.' },
      { status: 503 }
    )
  }
}
