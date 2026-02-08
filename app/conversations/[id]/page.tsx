import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ChatMessage } from '@/components/ChatMessage'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { Source } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getConversation(id: number) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })
    return conversation
  } catch {
    return null
  }
}

export default async function ConversationPage({ params }: PageProps) {
  const { id } = await params
  const conversationId = parseInt(id, 10)
  
  if (isNaN(conversationId)) {
    redirect('/ask')
  }
  
  const conversation = await getConversation(conversationId)

  if (!conversation) {
    redirect('/ask')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b">
        <Link href="/ask">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-semibold truncate">
          {conversation.title || 'Conversation'}
        </h1>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {conversation.messages.map((message: any) => (
            <ChatMessage
              key={message.id}
              role={message.role as 'user' | 'assistant'}
              content={message.content}
              sources={message.sources as Source[] | null}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Continue in Ask page */}
      <div className="p-4 border-t">
        <Link href={`/ask?conversation=${conversation.id}`}>
          <Button className="w-full">Continue Conversation</Button>
        </Link>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const conversationId = parseInt(id, 10)
  const conversation = isNaN(conversationId) ? null : await getConversation(conversationId)

  return {
    title: `${conversation?.title || 'Conversation'} | Second Brain`,
  }
}
