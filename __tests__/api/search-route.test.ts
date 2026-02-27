/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/search/route'

describe('/api/search route', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('returns 400 when full-text query is empty', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')
    const req = new NextRequest('http://localhost/api/search?q=')

    const res = await GET(req)
    const payload = await res.json()

    expect(res.status).toBe(400)
    expect(payload).toEqual({ detail: 'Query cannot be empty' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('clamps full-text limit and forwards payload', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          query: 'oauth',
          count: 1,
          results: [{ file_path: 'Security/API.md', title: 'API Security', heading: '', snippet: '', rank: 1 }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )
    const req = new NextRequest('http://localhost/api/search?q=oauth&limit=1000')

    const res = await GET(req)
    const payload = await res.json()

    expect(res.status).toBe(200)
    expect(payload.count).toBe(1)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('/search?q=oauth&limit=100')
  })

  it('supports semantic POST and ragTechnique alias', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [{ path: 'Security/API.md', title: 'API Security', snippet: '', score: 0.8, metadata: {} }],
          query_embedding_time_ms: 10,
          search_time_ms: 10,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )
    const req = new NextRequest('http://localhost/api/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'oauth', limit: 5, ragTechnique: 'multi-query' }),
    })

    const res = await POST(req)
    const payload = await res.json()

    expect(res.status).toBe(200)
    expect(payload.results).toHaveLength(1)

    const [, fetchInit] = fetchSpy.mock.calls[0]
    const body = JSON.parse(String(fetchInit?.body))
    expect(body).toEqual({ query: 'oauth', limit: 5, rag_technique: 'multi-query' })
  })
})
