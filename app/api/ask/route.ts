import { NextRequest, NextResponse } from 'next/server'
import { buildBackendHeaders, buildBackendUrl, forwardBackendJson } from '@/lib/backend-proxy'

type AskBody = {
  question?: string
  conversation_id?: string | number | null
  conversationId?: string | number | null
  provider?: string
  model?: string | null
  rag_technique?: string
  ragTechnique?: string
  include_sources?: boolean
  includeSources?: boolean
  stream?: boolean
  system_prompt?: string
  systemPrompt?: string
  temperature?: number
  max_tokens?: number
  maxTokens?: number
  top_p?: number
  topP?: number
  top_k?: number
  topK?: number
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function normalizeAskPayload(input: AskBody) {
  const payload: Record<string, unknown> = {
    question: input.question?.trim() || '',
    conversation_id: input.conversation_id ?? input.conversationId ?? undefined,
    provider: input.provider || 'ollama',
    model: input.model ?? undefined,
    rag_technique: input.rag_technique || input.ragTechnique || 'hybrid',
    include_sources: input.include_sources ?? input.includeSources ?? true,
    stream: input.stream ?? false,
    system_prompt: input.system_prompt || input.systemPrompt || undefined,
    temperature: toNumber(input.temperature),
    max_tokens: toNumber(input.max_tokens ?? input.maxTokens),
    top_p: toNumber(input.top_p ?? input.topP),
    top_k: toNumber(input.top_k ?? input.topK),
  }

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) {
      delete payload[key]
    }
  }

  return payload
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as AskBody | null
  const payload = normalizeAskPayload(body || {})

  if (!payload.question || typeof payload.question !== 'string') {
    return NextResponse.json({ detail: 'Question is required' }, { status: 400 })
  }

  const stream = payload.stream === true

  try {
    const response = await fetch(buildBackendUrl('/ask'), {
      method: 'POST',
      headers: buildBackendHeaders(),
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    if (stream) {
      if (!response.ok || !response.body) {
        return forwardBackendJson(response)
      }

      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      })
    }

    return forwardBackendJson(response)
  } catch {
    return NextResponse.json(
      { detail: 'Backend unavailable. Could not process /ask request.' },
      { status: 503 }
    )
  }
}
