/**
 * @jest-environment node
 */

const LIVE_BASE_URL = process.env.LIVE_BACKEND_URL || 'https://brain.nikolayvalev.com'

function buildUrl(path: string): string {
  return `${LIVE_BASE_URL}${path}`
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (process.env.BRAIN_API_KEY) {
    headers['X-API-Key'] = process.env.BRAIN_API_KEY
  }
  return headers
}

describe('Live backend contract checks', () => {
  it('health endpoint is reachable', async () => {
    const res = await fetch(buildUrl('/health'))
    expect(res.status).toBe(200)

    const body = await res.json() as {
      status?: string
      version?: string
      providers?: Record<string, unknown>
    }
    expect(body.status).toBe('ok')
    expect(typeof body.version).toBe('string')
    expect(typeof body.providers).toBe('object')
  })

  it('protected endpoints reject unauthenticated calls', async () => {
    if (process.env.BRAIN_API_KEY) {
      return
    }

    const [stats, search, ask] = await Promise.all([
      fetch(buildUrl('/stats')),
      fetch(buildUrl('/search?q=oauth&limit=3')),
      fetch(buildUrl('/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'test question' }),
      }),
    ])

    expect(stats.status).toBe(401)
    expect(search.status).toBe(401)
    expect(ask.status).toBe(401)
  })

  it('authenticated config and stats work when api key is provided', async () => {
    if (!process.env.BRAIN_API_KEY) {
      return
    }

    const [config, stats] = await Promise.all([
      fetch(buildUrl('/config'), { headers: authHeaders() }),
      fetch(buildUrl('/stats'), { headers: authHeaders() }),
    ])

    expect(config.status).toBe(200)
    expect(stats.status).toBe(200)

    const configBody = await config.json() as {
      providers?: unknown[]
      rag_techniques?: unknown[]
      defaults?: Record<string, unknown>
    }
    const statsBody = await stats.json() as {
      file_count?: number
      section_count?: number
      tag_count?: number
    }

    expect(Array.isArray(configBody.providers)).toBe(true)
    expect(Array.isArray(configBody.rag_techniques)).toBe(true)
    expect(typeof configBody.defaults).toBe('object')
    expect(typeof statsBody.file_count).toBe('number')
    expect(typeof statsBody.section_count).toBe('number')
    expect(typeof statsBody.tag_count).toBe('number')
  })
})
