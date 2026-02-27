import { NextRequest, NextResponse } from 'next/server'
import { buildBackendHeaders, buildBackendUrl, forwardBackendJson } from '@/lib/backend-proxy'

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action')
  const path = req.nextUrl.searchParams.get('path')

  let targetPath: string
  let query: Record<string, string | undefined> | undefined

  if (action === 'tags') {
    targetPath = '/tags'
  } else if (action === 'backlinks') {
    if (!path) {
      return NextResponse.json({ detail: 'path is required for backlinks' }, { status: 400 })
    }
    targetPath = '/backlinks'
    query = { path }
  } else if (path) {
    targetPath = '/file'
    query = { path }
  } else {
    return NextResponse.json(
      { detail: "Provide 'path' for /file, or use action=tags/backlinks." },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(buildBackendUrl(targetPath, query), {
      method: 'GET',
      headers: buildBackendHeaders(),
      cache: 'no-store',
    })

    return forwardBackendJson(response)
  } catch {
    return NextResponse.json(
      { detail: `Backend unavailable. Could not fetch ${targetPath}.` },
      { status: 503 }
    )
  }
}
