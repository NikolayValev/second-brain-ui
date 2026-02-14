import Link from 'next/link'
import { cn } from '@/lib/utils'
import { MarkdownRenderer } from './MarkdownRenderer'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Bot, ExternalLink } from 'lucide-react'

// Support both new API format (path/title/score) and legacy stored format (file_path/file_title/similarity)
type SourceData = {
  path?: string
  title?: string
  snippet?: string
  score?: number
  file_path?: string
  file_title?: string
  similarity?: number
}

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  sources?: SourceData[] | null
  isLoading?: boolean
  isStreaming?: boolean
}

export function ChatMessage({ role, content, sources, isLoading, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex gap-3 p-4', isUser ? 'bg-muted/30' : 'bg-background')}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={cn(isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm mb-1">{isUser ? 'You' : 'Assistant'}</div>
        {isLoading ? (
          <div className="flex gap-1">
            <span className="animate-bounce">●</span>
            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
          </div>
        ) : (
          <>
            {/* Show sources first — they arrive before answer tokens during streaming */}
            {sources && sources.length > 0 && (
              <div className={cn('pt-1', content ? 'mb-3 pb-3 border-b' : 'mb-1')}>
                <div className="text-xs font-medium text-muted-foreground mb-2">Sources:</div>
                <div className="flex flex-wrap gap-2">
                  {sources.filter(Boolean).filter(Boolean).map((source, index) => (
                    <Link
                      key={index}
                      href={`/notes/${source.path ?? source.file_path}`}
                      className="inline-flex items-center gap-1 text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {source.title ?? source.file_title ?? (source.path ?? source.file_path)?.split('/').pop()?.replace('.md', '')}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {content ? (
              <div>
                <MarkdownRenderer content={content} className="text-sm" />
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-foreground/70 animate-pulse ml-0.5 align-text-bottom" />
                )}
              </div>
            ) : isStreaming ? (
              <div className="flex gap-1 text-muted-foreground">
                <span className="animate-pulse">Thinking...</span>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isLoading?: boolean
  placeholder?: string
}

export function ChatInput({ value, onChange, onSubmit, isLoading, placeholder = 'Ask a question...' }: ChatInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim() && !isLoading) {
      onSubmit()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-4 bg-background">
      <div className="flex gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!value.trim() || isLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
    </form>
  )
}
