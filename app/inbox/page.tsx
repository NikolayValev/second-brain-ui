import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Inbox as InboxIcon, FileText, Calendar, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from '@/lib/format'

async function getInboxFiles() {
  try {
    const files = await prisma.file.findMany({
      where: { path: { startsWith: '00_Inbox/' } },
      include: {
        tags: { include: { tag: true } },
        sections: { take: 1, orderBy: { id: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return files
  } catch {
    return []
  }
}

export default async function InboxPage() {
  const inboxFiles = await getInboxFiles()

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <InboxIcon className="h-8 w-8 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold">Inbox</h1>
            <p className="text-muted-foreground text-sm">
              {inboxFiles.length} item{inboxFiles.length !== 1 ? 's' : ''} pending
            </p>
          </div>
        </div>
        {inboxFiles.length > 0 && (
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {inboxFiles.length}
          </Badge>
        )}
      </div>

      {inboxFiles.length > 0 ? (
        <div className="space-y-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {inboxFiles.map((file: any) => {
            const displayTitle = file.title || file.path.split('/').pop()?.replace('.md', '') || 'Untitled'
            const snippet = file.sections[0]?.content?.slice(0, 200) || ''
            const tags = file.tags.map((ft: { tag: { name: string } }) => ft.tag.name)

            return (
              <Link key={file.id} href={`/notes/${file.path}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <h3 className="font-medium truncate">{displayTitle}</h3>
                        </div>
                        {snippet && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2 ml-6">
                            {snippet}
                          </p>
                        )}
                        <div className="flex items-center gap-2 ml-6">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDistanceToNow(file.createdAt)}</span>
                          </div>
                          {tags.length > 0 && (
                            <div className="flex gap-1">
                              {tags.slice(0, 3).map((tag: string) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <InboxIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold mb-2">Inbox is empty</h2>
            <p className="text-muted-foreground">
              All caught up! New items will appear here when they&apos;re added to your inbox.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info card */}
      <Card className="mt-8 bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">About Inbox</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            The inbox contains newly captured notes that haven&apos;t been processed yet.
            Click on an item to view its content, then organize it into your knowledge base.
          </p>
          <p className="mt-2">
            <strong>Coming in v0.2:</strong> Process items directly from this page with AI-assisted categorization.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
