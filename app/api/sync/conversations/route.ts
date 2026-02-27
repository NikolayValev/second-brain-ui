import { NextResponse } from 'next/server'
import { buildBackendHeaders, buildBackendUrl, forwardBackendJson } from '@/lib/backend-proxy'

export async function POST() {
  try {
    const response = await fetch(buildBackendUrl('/sync/conversations'), {
      method: 'POST',
      headers: buildBackendHeaders(''),
      cache: 'no-store',
    })

    return forwardBackendJson(response)
  } catch {
    return NextResponse.json(
      { detail: 'Backend unavailable. Could not trigger /sync/conversations.' },
      { status: 503 }
    )
  }
}
