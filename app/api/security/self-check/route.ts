import { NextResponse } from 'next/server'
import { buildBackendHeaders, buildBackendUrl, forwardBackendJson } from '@/lib/backend-proxy'

export async function GET() {
  try {
    const response = await fetch(buildBackendUrl('/security/self-check'), {
      method: 'GET',
      headers: buildBackendHeaders(),
      cache: 'no-store',
    })

    return forwardBackendJson(response)
  } catch {
    return NextResponse.json(
      { detail: 'Backend unavailable. Could not fetch /security/self-check.' },
      { status: 503 }
    )
  }
}
