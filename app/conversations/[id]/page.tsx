import { redirect } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { ChatMessage } from '@/components/ChatMessage'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import type { Source } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

interface ConversationMessage {
  id: number | string
  role: 'user' | 'assistant' | string
  content: string
  sources?: unknown
}

interface ConversationDetail {
  id: number | string
  title?: string | null
  messages?: ConversationMessage[]
}

async function getConversation(id: number): Promise<ConversationDetail | null> {
  try {
    const { data, error } = await api.GET('/conversations/{conversation_id}', {
      params: { path: { conversation_id: id } },
    })

    if (error || !data) {
      return null
    }

    const payload = data as ConversationDetail & { conversation?: ConversationDetail }
    return payload.conversation || payload
  } catch {
    return null
  }
}

export default async function ConversationPage({ params }: PageProps) {
  const { id } = await params
  const conversationId = Number(id)

  if (!Number.isFinite(conversationId)) {
    redirect('/ask')
  }

  const conversation = await getConversation(Math.floor(conversationId))
  if (!conversation) {
    redirect('/ask')
  }

  const messages = Array.isArray(conversation.messages) ? conversation.messages : []

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen">
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

      <ScrollArea className="flex-1">
        <div className="divide-y">
          {messages.map((message) => (
            <ChatMessage
              key={String(message.id)}
              role={message.role === 'assistant' ? 'assistant' : 'user'}
              content={message.content}
              sources={Array.isArray(message.sources) ? (message.sources as Source[]) : null}
            />
          ))}
        </div>
      </ScrollArea>

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
  const conversationId = Number(id)
  const conversation = Number.isFinite(conversationId)
    ? await getConversation(Math.floor(conversationId))
    : null

  return {
    title: `${conversation?.title || 'Conversation'} | Second Brain`,
  }
}
