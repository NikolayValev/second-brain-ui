/**
 * @jest-environment node
 */

describe('backend-proxy helpers', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env.PYTHON_API_URL = 'http://127.0.0.1:9000'
    process.env.BRAIN_API_KEY = 'test-key'
  })

  it('builds backend URLs and skips empty query values', async () => {
    const { buildBackendUrl } = await import('@/lib/backend-proxy')
    const url = buildBackendUrl('/search', {
      q: 'oauth',
      limit: 20,
      empty: '',
      missing: undefined,
      nope: null,
    })

    expect(url).toBe('http://127.0.0.1:9000/search?q=oauth&limit=20')
  })

  it('includes api key and content type headers', async () => {
    const { buildBackendHeaders } = await import('@/lib/backend-proxy')
    const headers = buildBackendHeaders()

    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('X-API-Key')).toBe('test-key')
  })

  it('forwards json responses with status', async () => {
    const { forwardBackendJson } = await import('@/lib/backend-proxy')

    const backendResponse = new Response(
      JSON.stringify({ status: 'ok', value: 1 }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    )

    const forwarded = await forwardBackendJson(backendResponse)
    const payload = await forwarded.json()

    expect(forwarded.status).toBe(201)
    expect(payload).toEqual({ status: 'ok', value: 1 })
  })

  it('maps text responses to detail payloads', async () => {
    const { forwardBackendJson } = await import('@/lib/backend-proxy')

    const backendResponse = new Response('upstream bad gateway', {
      status: 502,
      headers: { 'Content-Type': 'text/plain' },
    })

    const forwarded = await forwardBackendJson(backendResponse)
    const payload = await forwarded.json()

    expect(forwarded.status).toBe(502)
    expect(payload).toEqual({ detail: 'upstream bad gateway' })
  })
})
