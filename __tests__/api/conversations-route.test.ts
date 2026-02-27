/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { DELETE, GET, POST } from '@/app/api/conversations/route'

describe('/api/conversations route', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('rejects invalid conversation id', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')
    const req = new NextRequest('http://localhost/api/conversations?id=bad-id')

    const res = await GET(req)
    const payload = await res.json()

    expect(res.status).toBe(400)
    expect(payload).toEqual({ detail: 'Invalid conversation ID' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('forwards list query and clamps limit', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ conversations: [], count: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )
    const req = new NextRequest(
      'http://localhost/api/conversations?sessionId=web-user-1&limit=999'
    )

    const res = await GET(req)
    const payload = await res.json()

    expect(res.status).toBe(200)
    expect(payload.count).toBe(0)
    const [url] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('/conversations?session_id=web-user-1&limit=100')
  })

  it('forwards conversation create payload', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ id: 42, title: 'Architecture Q&A' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )
    const req = new NextRequest('http://localhost/api/conversations', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'web-user-1',
        title: 'Architecture Q&A',
        systemPrompt: 'Use concise answers',
      }),
    })

    const res = await POST(req)
    const payload = await res.json()

    expect(res.status).toBe(200)
    expect(payload.id).toBe(42)
    const [, fetchInit] = fetchSpy.mock.calls[0]
    const body = JSON.parse(String(fetchInit?.body))
    expect(body).toEqual({
      session_id: 'web-user-1',
      title: 'Architecture Q&A',
      system_prompt: 'Use concise answers',
    })
  })

  it('returns 405 for delete since backend does not support it', async () => {
    const res = await DELETE()
    const payload = await res.json()

    expect(res.status).toBe(405)
    expect(payload.detail).toContain('not supported')
  })
})
