import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q') || ''
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')
    const tags = req.nextUrl.searchParams.get('tags')?.split(',').filter(Boolean) || []

    const whereClause: Record<string, unknown> = {}

    if (q) {
      whereClause.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { path: { contains: q, mode: 'insensitive' } },
        { sections: { some: { content: { contains: q, mode: 'insensitive' } } } },
        { sections: { some: { heading: { contains: q, mode: 'insensitive' } } } },
      ]
    }

    if (tags.length > 0) {
      whereClause.tags = {
        some: {
          tag: {
            name: { in: tags },
          },
        },
      }
    }

    const files = await prisma.file.findMany({
      where: whereClause,
      include: {
        tags: {
          include: { tag: true },
        },
        sections: {
          take: 1,
          orderBy: { id: 'asc' },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = files.map((file: any) => ({
      id: file.id,
      path: file.path,
      title: file.title,
      snippet: file.sections[0]?.content?.slice(0, 200) || '',
      tags: file.tags.map((ft: { tag: { name: string } }) => ft.tag.name),
      modifiedAt: file.createdAt,
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
