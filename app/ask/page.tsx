'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChatMessage, ChatInput } from '@/components/ChatMessage'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, MessageCircle, Trash2, ChevronLeft, Settings2, Bot, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Message, Source } from '@/lib/types'

interface Conversation {
  id: string
  title: string | null
  updatedAt: string
  messages: Message[]
}

interface ModelConfig {
  id: string
  name: string
  provider: string
  available: boolean
}

interface ProviderConfig {
  id: string
  name: string
  available: boolean
  models: ModelConfig[]
}

interface RAGTechnique {
  id: string
  name: string
  description: string
}

interface ConfigData {
  providers: ProviderConfig[]
  allProviders: ProviderConfig[]
  ragTechniques: RAGTechnique[]
  defaults: {
    provider: string
    model: string
    ragTechnique: string
  }
}

export default function AskPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Model/Provider state
  const [config, setConfig] = useState<ConfigData | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [selectedRAG, setSelectedRAG] = useState<string>('')

  // Load config
  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/api/config')
        const data = await response.json()
        setConfig(data)
        setSelectedProvider(data.defaults.provider)
        setSelectedModel(data.defaults.model)
        setSelectedRAG(data.defaults.ragTechnique)
      } catch (error) {
        console.error('Failed to load config:', error)
      }
    }
    loadConfig()
  }, [])

  // Load conversations
  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await fetch('/api/conversations')
        const data = await response.json()
        setConversations(data.conversations || [])
      } catch (error) {
        console.error('Failed to load conversations:', error)
      }
    }
    loadConversations()
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations?id=${id}`)
      const data = await response.json()
      if (data.conversation) {
        setCurrentConversation(data.conversation)
        setMessages(data.conversation.messages || [])
        setShowSidebar(false)
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }

  const startNewConversation = () => {
    setCurrentConversation(null)
    setMessages([])
    setInput('')
    setShowSidebar(false)
  }

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`/api/conversations?id=${id}`, { method: 'DELETE' })
      setConversations(conversations.filter((c) => c.id !== id))
      if (currentConversation?.id === id) {
        startNewConversation()
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
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

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          conversationId: currentConversation?.id,
          provider: selectedProvider,
          model: selectedModel,
          ragTechnique: selectedRAG,
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        conversationId: data.conversationId,
        role: 'assistant',
        content: data.answer,
        sources: data.sources as Source[] || null,
        createdAt: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Update current conversation if new
      if (!currentConversation && data.conversationId) {
        const newConv = {
          id: data.conversationId,
          title: userMessage.content.slice(0, 50),
          updatedAt: new Date().toISOString(),
          messages: [userMessage, assistantMessage],
        }
        setCurrentConversation(newConv)
        setConversations((prev) => [newConv, ...prev])
      }
    } catch (error) {
      console.error('Ask error:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          conversationId: '',
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your question. Please try again.',
          sources: null,
          createdAt: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-screen">
      {/* Sidebar - Conversation History */}
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
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => loadConversation(conv.id)}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-muted group w-full text-left select-none',
                    currentConversation?.id === conv.id && 'bg-muted'
                  )}
                >
                  <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-sm">
                    {conv.title || 'New conversation'}
                  </span>
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="flex items-center gap-2 p-4 border-b md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)}>
            <ChevronLeft className={cn('h-5 w-5 transition-transform', showSidebar && 'rotate-180')} />
          </Button>
          <h1 className="font-semibold truncate">
            {currentConversation?.title || 'New Chat'}
          </h1>
        </div>

        {/* Messages */}
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
                    onClick={() => {
                      setInput(suggestion)
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  sources={message.sources}
                />
              ))}
              {isLoading && (
                <ChatMessage role="assistant" content="" isLoading />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="border-t">
          {/* Settings Toggle & Panel */}
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
                  {config?.providers.find(p => p.id === selectedProvider)?.name}: {selectedModel}
                </span>
              )}
            </Button>
            
            {showSettings && config && (
              <div className="mt-3 p-4 bg-muted/50 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Provider Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Provider
                    </label>
                    <Select value={selectedProvider} onValueChange={(value) => {
                      setSelectedProvider(value)
                      // Reset model to first available for this provider
                      const provider = config.providers.find(p => p.id === value)
                      if (provider && provider.models.length > 0) {
                        setSelectedModel(provider.models[0].id)
                      }
                    }}>
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

                  {/* Model Selection */}
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
                          .find(p => p.id === selectedProvider)
                          ?.models.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* RAG Technique Selection */}
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
                        {config.ragTechniques.map((technique) => (
                          <SelectItem key={technique.id} value={technique.id}>
                            <div className="flex flex-col">
                              <span>{technique.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedRAG && (
                      <p className="text-xs text-muted-foreground">
                        {config.ragTechniques.find(t => t.id === selectedRAG)?.description}
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

      {/* Backdrop for mobile sidebar */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  )
}
