import { notFound } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { TagList } from '@/components/TagPill'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, FileText, Link as LinkIcon } from 'lucide-react'

interface PageProps {
  params: Promise<{ path: string[] }>
}

interface FileData {
  path: string
  title: string
  content: string
  tags?: string[]
}

interface BacklinkData {
  path: string
  title: string
}

async function getFile(path: string): Promise<FileData | null> {
  try {
    const { data, error } = await api.GET('/file', {
      params: { query: { path } }
    })
    if (error || !data) {
      return null
    }
    return data as FileData
  } catch {
    return null
  }
}

async function getBacklinks(path: string): Promise<BacklinkData[]> {
  try {
    const { data, error } = await api.GET('/backlinks', {
      params: { query: { path } }
    })
    if (error || !data) {
      return []
    }
    return (data as { backlinks?: BacklinkData[] }).backlinks || []
  } catch {
    return []
  }
}

export default async function NotePage({ params }: PageProps) {
  const { path } = await params
  // Decode URL-encoded path segments (e.g., %20 -> space)
  const filePath = path.map(segment => decodeURIComponent(segment)).join('/')
  const file = await getFile(filePath)

  if (!file) {
    notFound()
  }

  const backlinks = await getBacklinks(filePath)
  const tags = file.tags || []
  const content = file.content || ''

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Navigation */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {file.title || filePath.split('/').pop()?.replace('.md', '')}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>{filePath}</span>
          </div>
        </div>
        {tags.length > 0 && (
          <div className="mt-3">
            <TagList tags={tags} />
          </div>
        )}
      </div>

      {/* Content */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <MarkdownRenderer content={content} />
        </CardContent>
      </Card>

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <>
          <Separator className="my-6" />
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Backlinks ({backlinks.length})
            </h2>
            <div className="grid gap-2">
              {backlinks.map((link: BacklinkData) => (
                <Link key={link.path} href={`/notes/${link.path}`}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardContent className="p-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {link.title || link.path.split('/').pop()?.replace('.md', '')}
                      </span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {link.path.split('/')[0]}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { path } = await params
  const filePath = path.map(segment => decodeURIComponent(segment)).join('/')
  const file = await getFile(filePath)

  if (!file) {
    return { title: 'Not Found' }
  }

  return {
    title: `${file.title || filePath.split('/').pop()?.replace('.md', '')} | Second Brain`,
    description: file.content?.slice(0, 160) || '',
  }
}
