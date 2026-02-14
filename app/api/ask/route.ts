import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000'
const BRAIN_API_KEY = process.env.BRAIN_API_KEY || ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      question, 
      conversationId, 
      sessionId = 'default',
      provider = 'ollama',
      model = '',
      ragTechnique = 'hybrid',
      stream = false,
    } = body

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (BRAIN_API_KEY) headers['X-API-Key'] = BRAIN_API_KEY

    // ── Streaming path: proxy SSE from Python backend ──
    if (stream) {
      try {
        const response = await fetch(`${PYTHON_API_URL}/ask`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            question,
            conversation_id: conversationId ? Number(conversationId) : undefined,
            provider,
            model: model || undefined,
            rag_technique: ragTechnique,
            include_sources: true,
            stream: true,
          }),
        })

        if (!response.ok || !response.body) {
          const errText = await response.text().catch(() => 'Unknown error')
          return NextResponse.json(
            { error: `Backend error: ${errText}` },
            { status: response.status }
          )
        }

        // Proxy the SSE stream directly to the client
        return new Response(response.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        })
      } catch {
        return NextResponse.json(
          { error: 'Backend unavailable for streaming' },
          { status: 503 }
        )
      }
    }

    // ── Non-streaming path (original logic) ──
    let answer: string
    let sources: Array<{ path: string; title: string; snippet: string; score: number }> = []
    let backendConversationId: number | null = null

    try {
      const response = await fetch(`${PYTHON_API_URL}/ask`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          question, 
          conversation_id: conversationId ? Number(conversationId) : undefined,
          provider,
          model: model || undefined,
          rag_technique: ragTechnique,
          include_sources: true,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        answer = data.answer
        sources = data.sources || []
        backendConversationId = data.conversation_id ?? null
      } else {
        // Fallback: simple search-based response
        answer = await generateFallbackResponse(question)
      }
    } catch {
      // Python backend not available, use fallback
      answer = await generateFallbackResponse(question)
    }

    // Get or create conversation in PG
    let conversation
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: Number(conversationId) },
      })
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          sessionId,
          title: question.slice(0, 100),
        },
      })
    }

    // Save messages
    await prisma.message.createMany({
      data: [
        {
          conversationId: conversation.id,
          role: 'user',
          content: question,
        },
        {
          conversationId: conversation.id,
          role: 'assistant',
          content: answer,
          sources: sources.length > 0 ? JSON.parse(JSON.stringify(sources)) : undefined,
        },
      ],
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({
      answer,
      sources,
      conversationId: conversation.id,
    })
  } catch (error) {
    console.error('Ask error:', error)
    return NextResponse.json({ error: 'Failed to process question' }, { status: 500 })
  }
}

async function generateFallbackResponse(question: string): Promise<string> {
  // Simple keyword search to find relevant files
  const keywords = question.toLowerCase().split(' ').filter((w) => w.length > 3)
  
  if (keywords.length === 0) {
    return "I couldn't find relevant information for your question. Please try rephrasing."
  }

  const files = await prisma.file.findMany({
    where: {
      OR: keywords.map((keyword) => ({
        OR: [
          { title: { contains: keyword, mode: 'insensitive' as const } },
          { sections: { some: { content: { contains: keyword, mode: 'insensitive' as const } } } },
        ],
      })),
    },
    include: { sections: true },
    take: 5,
  })

  if (files.length === 0) {
    return "I couldn't find relevant information in your knowledge base. Try searching for specific topics."
  }

  const relevantContent = files
    .flatMap((f: { title: string | null; path: string; sections: { content: string }[] }) => 
      f.sections.map((s: { content: string }) => `**${f.title || f.path}**: ${s.content.slice(0, 200)}...`)
    )
    .slice(0, 3)
    .join('\n\n')

  return `Based on your knowledge base, here's what I found:\n\n${relevantContent}\n\n*Note: For full RAG capabilities, ensure the Python backend is running.*`
}
