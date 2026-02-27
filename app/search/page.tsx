'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SearchBarWithButton } from '@/components/SearchBar'
import { NoteCard } from '@/components/NoteCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Search as SearchIcon } from 'lucide-react'

type SearchMode = 'full-text' | 'semantic'

interface NormalizedResult {
  id: string
  path: string
  title: string | null
  snippet: string
  tags: string[]
  modifiedAt: string
  score?: number
}

interface ConfigRagTechnique {
  id: string
  name: string
}

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [mode, setMode] = useState<SearchMode>('full-text')
  const [ragTechnique, setRagTechnique] = useState('hybrid')
  const [ragTechniques, setRagTechniques] = useState<ConfigRagTechnique[]>([])
  const [results, setResults] = useState<NormalizedResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/api/config')
        if (!response.ok) return

        const data = await response.json() as {
          rag_techniques?: ConfigRagTechnique[]
          defaults?: { rag_technique?: string }
        }

        const techniques = Array.isArray(data.rag_techniques) ? data.rag_techniques : []
        if (techniques.length > 0) {
          setRagTechniques(techniques)
          setRagTechnique(data.defaults?.rag_technique || techniques[0].id)
        }
      } catch {
        // Keep defaults if config is unavailable.
      }
    }

    loadConfig()
  }, [])

  useEffect(() => {
    async function fetchResults() {
      if (!query) {
        setResults([])
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      try {
        if (mode === 'full-text') {
          const params = new URLSearchParams({ q: query, limit: '20' })
          const response = await fetch(`/api/search?${params.toString()}`)
          const payload = await response.json().catch(() => ({})) as {
            detail?: string
            results?: Array<{
              file_path: string
              title?: string | null
              snippet?: string
            }>
          }

          if (!response.ok) {
            throw new Error(payload.detail || 'Full-text search failed')
          }

          const normalized = (payload.results || []).map((result, index) => ({
            id: `${result.file_path}-${index}`,
            path: result.file_path,
            title: result.title ?? null,
            snippet: result.snippet || '',
            tags: [],
            modifiedAt: new Date().toISOString(),
          }))
          setResults(normalized)
          return
        }

        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            limit: 20,
            rag_technique: ragTechnique,
          }),
        })
        const payload = await response.json().catch(() => ({})) as {
          detail?: string
          results?: Array<{
            path: string
            title?: string | null
            snippet?: string
            score?: number
            metadata?: { tags?: string[]; updated_at?: string; created_at?: string }
          }>
        }

        if (!response.ok) {
          throw new Error(payload.detail || 'Semantic search failed')
        }

        const normalized = (payload.results || []).map((result, index) => ({
          id: `${result.path}-${index}`,
          path: result.path,
          title: result.title ?? null,
          snippet: result.snippet || '',
          tags: Array.isArray(result.metadata?.tags) ? result.metadata.tags : [],
          modifiedAt: result.metadata?.updated_at || result.metadata?.created_at || new Date().toISOString(),
          score: result.score,
        }))
        setResults(normalized)
      } catch (requestError) {
        setResults([])
        setError(requestError instanceof Error ? requestError.message : 'Search failed')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [query, mode, ragTechnique])

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Search</h1>

      <SearchBarWithButton defaultValue={query} className="mb-4" />

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Button
          variant={mode === 'full-text' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('full-text')}
        >
          Full-text
        </Button>
        <Button
          variant={mode === 'semantic' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('semantic')}
        >
          Semantic
        </Button>
        {mode === 'semantic' && ragTechniques.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {ragTechniques.map((technique) => (
              <Button
                key={technique.id}
                variant={ragTechnique === technique.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRagTechnique(technique.id)}
              >
                {technique.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center text-destructive">
            <p>{error}</p>
          </CardContent>
        </Card>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Found {results.length} result{results.length !== 1 ? 's' : ''} using {mode} search
          </div>
          {results.map((result) => (
            <NoteCard
              key={result.id}
              path={result.path}
              title={result.title}
              snippet={result.snippet}
              tags={result.tags}
              modifiedAt={result.modifiedAt}
            />
          ))}
        </div>
      ) : query ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No results found. Try different keywords.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Enter a search query to find notes in your knowledge base.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Search</h1>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
