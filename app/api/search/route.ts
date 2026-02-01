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
      orderBy: { modifiedAt: 'desc' },
    })

    const results = files.map((file) => ({
      id: file.id,
      path: file.path,
      title: file.title,
      snippet: file.sections[0]?.content.slice(0, 200) || '',
      tags: file.tags.map((ft) => ft.tag.name),
      modifiedAt: file.modifiedAt,
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
