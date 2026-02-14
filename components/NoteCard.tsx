import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Calendar } from 'lucide-react'
import { formatDistanceToNow } from '@/lib/format'

interface NoteCardProps {
  path: string
  title: string | null
  snippet?: string
  tags?: string[]
  modifiedAt: Date | string
}

export function NoteCard({ path, title, snippet, tags, modifiedAt }: NoteCardProps) {
  const displayTitle = title || path.split('/').pop()?.replace('.md', '') || 'Untitled'
  const date = typeof modifiedAt === 'string' ? new Date(modifiedAt) : modifiedAt

  return (
    <Link href={`/notes/${path}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <CardTitle className="text-base font-medium truncate">{displayTitle}</CardTitle>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Calendar className="h-3 w-3" />
              <span>{formatDistanceToNow(date)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {snippet && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{snippet}</p>
          )}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 5).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{tags.length - 5}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
