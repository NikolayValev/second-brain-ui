import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { api } from '@/lib/api-client'
import { SearchBar } from '@/components/SearchBar'
import { NoteCard } from '@/components/NoteCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Hash, Layers, Inbox, ArrowRight, Brain, Search, MessageSquare, Lock } from 'lucide-react'

// Helper to count all files in a folder structure (recursive)
function countFolderFiles(folder: { files: unknown[]; folders: { files: unknown[]; folders: unknown[] }[] }): number {
  let count = folder.files.length
  for (const subfolder of folder.folders) {
    count += countFolderFiles(subfolder as { files: unknown[]; folders: { files: unknown[]; folders: unknown[] }[] })
  }
  return count
}

// Helper to count all files in inbox contents response
function countInboxFiles(data: { root_files: unknown[]; folders: { files: unknown[]; folders: unknown[] }[] }): number {
  let count = data.root_files.length
  for (const folder of data.folders) {
    count += countFolderFiles(folder as { files: unknown[]; folders: { files: unknown[]; folders: unknown[] }[] })
  }
  return count
}

async function getStats() {
  try {
    const [totalFiles, totalSections, totalTags] = await prisma.$transaction([
      prisma.file.count(),
      prisma.section.count(),
      prisma.tag.count(),
    ])
    
    // Get inbox count from Python API (same source as inbox page)
    let inboxCount = 0
    try {
      const { data } = await api.GET('/inbox/contents')
      if (data) {
        inboxCount = countInboxFiles(data)
      }
    } catch {
      // Fallback to database count if API fails
      inboxCount = await prisma.file.count({ where: { path: { startsWith: '00_Inbox/' } } })
    }
    
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
  const { userId } = await auth()

  // Show landing page for signed-out users
  if (!userId) {
    return <LandingPage />
  }

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

function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="text-center py-16 md:py-24">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Brain className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Second Brain
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your personal knowledge management system powered by AI. Organize, search, and query your notes with intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignInButton mode="modal">
              <Button size="lg" className="text-lg px-8">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Create Account
              </Button>
            </SignUpButton>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 border-t">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Why Second Brain?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-blue-500/10 p-3">
                    <Search className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Semantic Search</h3>
                <p className="text-muted-foreground">
                  Find exactly what you&apos;re looking for with AI-powered semantic search across all your notes.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-purple-500/10 p-3">
                    <MessageSquare className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Ask Questions</h3>
                <p className="text-muted-foreground">
                  Query your knowledge base using natural language and get intelligent answers with sources.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-green-500/10 p-3">
                    <FileText className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Markdown Notes</h3>
                <p className="text-muted-foreground">
                  Works with your existing Markdown files. Beautiful rendering with full support for links and tags.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 border-t text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-muted p-3">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Sign in to access your personal knowledge base and start exploring your notes with AI.
          </p>
          <SignInButton mode="modal">
            <Button size="lg" className="text-lg px-8">
              Sign In to Continue
            </Button>
          </SignInButton>
        </div>
      </div>
    </div>
  )
}
