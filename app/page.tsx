import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { SearchBar } from '@/components/SearchBar'
import { NoteCard } from '@/components/NoteCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Hash, Layers, Inbox, ArrowRight } from 'lucide-react'

async function getStats() {
  try {
    const [totalFiles, totalSections, totalTags, inboxCount] = await prisma.$transaction([
      prisma.file.count(),
      prisma.section.count(),
      prisma.tag.count(),
      prisma.file.count({ where: { path: { startsWith: '00_Inbox/' } } }),
    ])
    return { totalFiles, totalSections, totalTags, inboxCount }
  } catch {
    return { totalFiles: 0, totalSections: 0, totalTags: 0, inboxCount: 0 }
  }
}

async function getRecentNotes() {
  try {
    const files = await prisma.file.findMany({
      include: {
        tags: { include: { tag: true } },
        sections: { take: 1, orderBy: { id: 'asc' } },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return files.map((file: any) => ({
      id: file.id,
      path: file.path,
      title: file.title,
      snippet: file.sections[0]?.content?.slice(0, 200) || '',
      tags: file.tags.map((ft: { tag: { name: string } }) => ft.tag.name),
      modifiedAt: file.createdAt,
    }))
  } catch {
    return []
  }
}

export default async function DashboardPage() {
  const [stats, recentNotes] = await Promise.all([getStats(), getRecentNotes()])

  const statCards = [
    { label: 'Files', value: stats.totalFiles, icon: FileText, color: 'text-blue-500' },
    { label: 'Sections', value: stats.totalSections, icon: Layers, color: 'text-green-500' },
    { label: 'Tags', value: stats.totalTags, icon: Hash, color: 'text-purple-500' },
  ]

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Second Brain</h1>
        <p className="text-muted-foreground">Your personal knowledge management system</p>
      </div>

      {/* Search Bar */}
      <SearchBar className="mb-8" placeholder="Search your knowledge base..." />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Inbox Card with Badge */}
        <Link href="/inbox">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Inbox className="h-8 w-8 text-orange-500" />
                  {stats.inboxCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {stats.inboxCount}
                    </Badge>
                  )}
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.inboxCount}</div>
                  <div className="text-sm text-muted-foreground">Inbox</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Notes */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Notes</h2>
          <Link href="/search" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {recentNotes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {recentNotes.map((note) => (
              <NoteCard
                key={note.id}
                path={note.path}
                title={note.title}
                snippet={note.snippet}
                tags={note.tags}
                modifiedAt={note.modifiedAt}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notes yet. Start by adding files to your knowledge base.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link href="/ask">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  💬 Ask a Question
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">Query your knowledge base with AI</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/search">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  🔍 Search Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">Find specific information</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/inbox">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  📥 Process Inbox
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">Review pending items</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
