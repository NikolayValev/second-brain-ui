'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SearchBarWithButton } from '@/components/SearchBar'
import { NoteCard } from '@/components/NoteCard'
import { TagPill } from '@/components/TagPill'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Search as SearchIcon } from 'lucide-react'
import type { SearchResult } from '@/lib/types'

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''
  const tagsParam = searchParams.get('tags') || ''
  
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTags, setActiveTags] = useState<string[]>(
    tagsParam ? tagsParam.split(',') : []
  )
  const [availableTags, setAvailableTags] = useState<string[]>([])

  useEffect(() => {
    async function fetchResults() {
      if (!query && activeTags.length === 0) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (query) params.set('q', query)
        if (activeTags.length > 0) params.set('tags', activeTags.join(','))
        
        const response = await fetch(`/api/search?${params}`)
        const data = await response.json()
        setResults(data.results || [])
        
        // Extract unique tags from results
        const tags = new Set<string>()
        data.results?.forEach((r: SearchResult) => r.tags?.forEach((t) => tags.add(t)))
        setAvailableTags(Array.from(tags))
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [query, activeTags])

  const toggleTag = (tag: string) => {
    const newTags = activeTags.includes(tag)
      ? activeTags.filter((t) => t !== tag)
      : [...activeTags, tag]
    
    setActiveTags(newTags)
    
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (newTags.length > 0) params.set('tags', newTags.join(','))
    router.push(`/search?${params}`)
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Search</h1>
      
      <SearchBarWithButton defaultValue={query} className="mb-6" />
      
      {/* Tag filters */}
      {availableTags.length > 0 && (
        <div className="mb-6">
          <div className="text-sm font-medium mb-2">Filter by tags:</div>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <TagPill
                key={tag}
                name={tag}
                active={activeTags.includes(tag)}
                onClick={() => toggleTag(tag)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Found {results.length} result{results.length !== 1 ? 's' : ''}
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
      ) : query || activeTags.length > 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No results found. Try different keywords or filters.</p>
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
