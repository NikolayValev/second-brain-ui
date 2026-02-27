/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/ask/route'

describe('/api/ask route', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('returns 400 when question is missing', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')
    const req = new NextRequest('http://localhost/api/ask', {
      method: 'POST',
      body: JSON.stringify({ stream: false }),
    })

    const res = await POST(req)
    const payload = await res.json()

    expect(res.status).toBe(400)
    expect(payload).toEqual({ detail: 'Question is required' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('normalizes payload and forwards sync responses', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          answer: 'ok',
          sources: [],
          conversation_id: '42',
          model_used: 'gpt-4o-mini',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    )

    const req = new NextRequest('http://localhost/api/ask', {
      method: 'POST',
      body: JSON.stringify({
        question: 'What are my priorities?',
        conversationId: '42',
        provider: 'openai',
        model: 'gpt-4o-mini',
        ragTechnique: 'hyde',
        includeSources: false,
        systemPrompt: 'Be concise',
        temperature: 0.4,
        maxTokens: 512,
        topP: 0.9,
        topK: 20,
      }),
    })

    const res = await POST(req)
    const payload = await res.json()

    expect(res.status).toBe(200)
    expect(payload.answer).toBe('ok')

    const [, fetchInit] = fetchSpy.mock.calls[0]
    const body = JSON.parse(String(fetchInit?.body))
    expect(body).toMatchObject({
      question: 'What are my priorities?',
      conversation_id: '42',
      provider: 'openai',
      model: 'gpt-4o-mini',
      rag_technique: 'hyde',
      include_sources: false,
      system_prompt: 'Be concise',
      temperature: 0.4,
      max_tokens: 512,
      top_p: 0.9,
      top_k: 20,
      stream: false,
    })
  })

  it('passes through SSE response for stream=true', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('data: {"type":"done","conversation_id":"7"}\n\n', {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })
    )

    const req = new NextRequest('http://localhost/api/ask', {
      method: 'POST',
      body: JSON.stringify({
        question: 'stream this',
        stream: true,
      }),
    })

    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/event-stream')
  })
})
