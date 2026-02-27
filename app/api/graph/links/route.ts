import { NextRequest, NextResponse } from 'next/server'
import { buildBackendHeaders, buildBackendUrl, forwardBackendJson } from '@/lib/backend-proxy'

function parseMaxEdges(raw: string | null): number {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) {
    return 2000
  }

  return Math.min(20000, Math.max(1, Math.floor(parsed)))
}

export async function GET(req: NextRequest) {
  const maxEdges = parseMaxEdges(req.nextUrl.searchParams.get('max_edges'))
  const includeDangling = req.nextUrl.searchParams.get('include_dangling')

  try {
    const response = await fetch(
      buildBackendUrl('/graph/links', {
        max_edges: maxEdges,
        include_dangling: includeDangling ?? undefined,
      }),
      {
        method: 'GET',
        headers: buildBackendHeaders(),
        cache: 'no-store',
      }
    )

    return forwardBackendJson(response)
  } catch {
    return NextResponse.json(
      { detail: 'Backend unavailable. Could not fetch /graph/links.' },
      { status: 503 }
    )
  }
}
