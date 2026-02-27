import { NextResponse } from 'next/server'
import { buildBackendHeaders, buildBackendUrl, forwardBackendJson } from '@/lib/backend-proxy'

export async function GET() {
  try {
    const response = await fetch(buildBackendUrl('/stats'), {
      method: 'GET',
      headers: buildBackendHeaders(),
      cache: 'no-store',
    })

    return forwardBackendJson(response)
  } catch {
    return NextResponse.json(
      { detail: 'Backend unavailable. Could not fetch /stats.' },
      { status: 503 }
    )
  }
}
