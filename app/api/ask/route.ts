import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { question, conversationId, sessionId = 'default' } = body

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    // Try to call the Python backend for RAG
    let answer: string
    let sources: Array<{ path: string; title: string; snippet: string; score: number }> = []

    try {
      const response = await fetch(`${PYTHON_API_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, conversation_id: conversationId }),
      })

      if (response.ok) {
        const data = await response.json()
        answer = data.answer
        sources = data.sources || []
      } else {
        // Fallback: simple search-based response
        answer = await generateFallbackResponse(question)
      }
    } catch {
      // Python backend not available, use fallback
      answer = await generateFallbackResponse(question)
    }

    // Get or create conversation
    let conversation
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
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
    .flatMap((f) => f.sections.map((s) => `**${f.title || f.path}**: ${s.content.slice(0, 200)}...`))
    .slice(0, 3)
    .join('\n\n')

  return `Based on your knowledge base, here's what I found:\n\n${relevantContent}\n\n*Note: For full RAG capabilities, ensure the Python backend is running.*`
}
