'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChatMessage, ChatInput } from '@/components/ChatMessage'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, MessageCircle, ChevronLeft, Settings2, Bot, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types'

interface Conversation {
  id: string
  title: string | null
  updatedAt: string
  messages: Message[]
}

interface BackendMessage {
  id?: number | string
  conversation_id?: number | string
  conversationId?: number | string
  role?: string
  content?: string
  sources?: unknown
  created_at?: string
  createdAt?: string
}

interface BackendConversation {
  id?: number | string
  title?: string | null
  updated_at?: string
  updatedAt?: string
  messages?: BackendMessage[]
}

interface ProviderModel {
  id: string
  name: string
  available: boolean
}

interface ProviderConfig {
  id: string
  name: string
  available: boolean
  models: ProviderModel[]
}

interface RAGTechnique {
  id: string
  name: string
  description: string
}

interface ConfigData {
  providers: ProviderConfig[]
  rag_techniques: RAGTechnique[]
  defaults: {
    provider: string
    model: string
    rag_technique: string
  }
}

function normalizeMessage(raw: BackendMessage): Message {
  const createdAtValue = raw.created_at || raw.createdAt
  const createdAt = createdAtValue ? new Date(createdAtValue) : new Date()
  const role = raw.role === 'assistant' ? 'assistant' : 'user'

  return {
    id: String(raw.id ?? crypto.randomUUID()),
    conversationId: String(raw.conversation_id ?? raw.conversationId ?? ''),
    role,
    content: raw.content || '',
    sources: Array.isArray(raw.sources) ? (raw.sources as Record<string, unknown>[]) : null,
    createdAt,
  }
}

function normalizeConversation(raw: BackendConversation): Conversation {
  return {
    id: String(raw.id ?? ''),
    title: raw.title ?? null,
    updatedAt: raw.updated_at || raw.updatedAt || new Date().toISOString(),
    messages: Array.isArray(raw.messages) ? raw.messages.map(normalizeMessage) : [],
  }
}

export default function AskPage() {
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [config, setConfig] = useState<ConfigData | null>(null)
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedRAG, setSelectedRAG] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/api/config')
        if (!response.ok) return

        const data = await response.json() as ConfigData
        setConfig(data)

        const defaultProvider = data.defaults?.provider || data.providers[0]?.id || 'ollama'
        const defaultModel =
          data.defaults?.model ||
          data.providers.find((provider) => provider.id === defaultProvider)?.models[0]?.id ||
          ''
        const defaultRag = data.defaults?.rag_technique || data.rag_techniques[0]?.id || 'hybrid'

        setSelectedProvider(defaultProvider)
        setSelectedModel(defaultModel)
        setSelectedRAG(defaultRag)
      } catch (error) {
        console.error('Failed to load config:', error)
      }
    }

    loadConfig()
  }, [])

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations?limit=50')
      if (!response.ok) return

      const payload = await response.json() as { conversations?: BackendConversation[] } | BackendConversation[]
      const rawConversations = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.conversations)
          ? payload.conversations
          : []

      setConversations(rawConversations.map(normalizeConversation))
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversation = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/conversations?id=${encodeURIComponent(id)}`)
      if (!response.ok) return

      const payload = await response.json() as { conversation?: BackendConversation } | BackendConversation
      const rawConversation =
        !Array.isArray(payload) && 'conversation' in payload
          ? payload.conversation
          : payload

      if (!rawConversation) return

      const normalized = normalizeConversation(rawConversation)
      setCurrentConversation(normalized)
      setMessages(normalized.messages)
      setShowSidebar(false)
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }, [])

  useEffect(() => {
    const conversationFromUrl = searchParams.get('conversation')
    if (conversationFromUrl) {
      loadConversation(conversationFromUrl)
    }
  }, [searchParams, loadConversation])

  const startNewConversation = () => {
    setCurrentConversation(null)
    setMessages([])
    setInput('')
    setShowSidebar(false)
  }

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversationId: currentConversation?.id || '',
      role: 'user',
      content: input.trim(),
      sources: null,
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsStreaming(true)

    const assistantId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        conversationId: currentConversation?.id || '',
        role: 'assistant',
        content: '',
        sources: null,
        createdAt: new Date(),
      },
    ])

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          conversation_id: currentConversation?.id || undefined,
          provider: selectedProvider,
          model: selectedModel || undefined,
          rag_technique: selectedRAG,
          include_sources: true,
          stream: true,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: 'Request failed' }))
        throw new Error(errData.detail || errData.error || `HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      const sources: Record<string, unknown>[] = []
      let fullContent = ''
      let newConversationId: string | null = null
      let buffer = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data:')) continue

          try {
            const payload = JSON.parse(line.replace(/^data:\s*/, '')) as {
              type?: string
              source?: Record<string, unknown>
              token?: string
              content?: string
              conversation_id?: string | number
            }

            if (payload.type === 'source') {
              const source =
                payload.source && typeof payload.source === 'object'
                  ? payload.source
                  : payload
              sources.push(source)

              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantId ? { ...message, sources: [...sources] } : message
                )
              )
            }

            if (payload.type === 'token') {
              const token = payload.token ?? payload.content ?? ''
              fullContent += token

              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantId ? { ...message, content: fullContent } : message
                )
              )
            }

            if (payload.type === 'done') {
              if (payload.conversation_id !== undefined && payload.conversation_id !== null) {
                newConversationId = String(payload.conversation_id)
              }
            }
          } catch {
            // Ignore malformed SSE lines.
          }
        }
      }

      setIsStreaming(false)

      if (newConversationId) {
        if (!currentConversation) {
          setCurrentConversation({
            id: newConversationId,
            title: userMessage.content.slice(0, 60),
            updatedAt: new Date().toISOString(),
            messages: [],
          })
        } else {
          setCurrentConversation((prev) =>
            prev ? { ...prev, id: newConversationId, updatedAt: new Date().toISOString() } : prev
          )
        }
      }

      await loadConversations()
    } catch (error) {
      console.error('Ask error:', error)
      setIsStreaming(false)
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: 'Sorry, I encountered an error processing your question. Please try again.',
              }
            : message
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-screen">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 bg-background border-r transform transition-transform duration-200 md:relative md:translate-x-0',
          showSidebar ? 'translate-x-0' : '-translate-x-full',
          'md:block'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <Button onClick={startNewConversation} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => loadConversation(conversation.id)}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-muted group w-full text-left select-none',
                    currentConversation?.id === conversation.id && 'bg-muted'
                  )}
                >
                  <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-sm">
                    {conversation.title || 'New conversation'}
                  </span>
                </button>
              ))}
              {conversations.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No conversations yet
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 p-4 border-b md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)}>
            <ChevronLeft className={cn('h-5 w-5 transition-transform', showSidebar && 'rotate-180')} />
          </Button>
          <h1 className="font-semibold truncate">
            {currentConversation?.title || 'New Chat'}
          </h1>
        </div>

        <ScrollArea className="flex-1">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Ask your Second Brain</h2>
              <p className="text-muted-foreground max-w-md">
                Ask questions about your knowledge base and get AI-powered answers with source citations.
              </p>
              <div className="mt-8 grid gap-2 w-full max-w-md">
                {[
                  'What are my main projects?',
                  'Summarize my notes on productivity',
                  'What did I learn about React?',
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    className="justify-start text-left h-auto py-3"
                    onClick={() => setInput(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  sources={
                    Array.isArray(message.sources)
                      ? (message.sources as Array<{
                          path?: string
                          title?: string
                          snippet?: string
                          score?: number
                          file_path?: string
                          file_title?: string
                          similarity?: number
                        }>)
                      : null
                  }
                  isStreaming={
                    isStreaming &&
                    message.role === 'assistant' &&
                    index === messages.length - 1
                  }
                />
              ))}
              {isLoading && !isStreaming && (
                <ChatMessage role="assistant" content="" isLoading />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <div className="border-t">
          <div className="px-4 pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Model Settings
              {selectedProvider && selectedModel && (
                <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">
                  {config?.providers.find((provider) => provider.id === selectedProvider)?.name}: {selectedModel}
                </span>
              )}
            </Button>

            {showSettings && config && (
              <div className="mt-3 p-4 bg-muted/50 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Provider
                    </label>
                    <Select
                      value={selectedProvider}
                      onValueChange={(value) => {
                        setSelectedProvider(value)
                        const provider = config.providers.find((item) => item.id === value)
                        if (provider && provider.models.length > 0) {
                          setSelectedModel(provider.models[0].id)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {config.providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Model
                    </label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {config.providers
                          .find((provider) => provider.id === selectedProvider)
                          ?.models.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      RAG Technique
                    </label>
                    <Select value={selectedRAG} onValueChange={setSelectedRAG}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select technique" />
                      </SelectTrigger>
                      <SelectContent>
                        {config.rag_techniques.map((technique) => (
                          <SelectItem key={technique.id} value={technique.id}>
                            {technique.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedRAG && (
                      <p className="text-xs text-muted-foreground">
                        {config.rag_techniques.find((technique) => technique.id === selectedRAG)?.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>

      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  )
}
