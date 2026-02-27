import { NextResponse } from 'next/server'

const DEFAULT_API_URL = 'http://127.0.0.1:8000'

export const PYTHON_API_URL = process.env.PYTHON_API_URL || DEFAULT_API_URL
export const BRAIN_API_KEY = process.env.BRAIN_API_KEY || ''

type QueryValue = string | number | boolean | null | undefined

export function buildBackendUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(path, PYTHON_API_URL)

  if (!query) {
    return url.toString()
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') {
      continue
    }
    url.searchParams.set(key, String(value))
  }

  return url.toString()
}

export function buildBackendHeaders(contentType: string = 'application/json'): Headers {
  const headers = new Headers()

  if (contentType) {
    headers.set('Content-Type', contentType)
  }

  if (BRAIN_API_KEY) {
    headers.set('X-API-Key', BRAIN_API_KEY)
  }

  return headers
}

export async function forwardBackendJson(response: Response): Promise<NextResponse> {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const body = await response.json().catch(() => ({ detail: 'Invalid JSON response from backend' }))
    return NextResponse.json(body, { status: response.status })
  }

  const text = await response.text().catch(() => '')
  return NextResponse.json(
    { detail: text || response.statusText || 'Request failed' },
    { status: response.status }
  )
}
