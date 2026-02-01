import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const path = req.nextUrl.searchParams.get('path')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')
    const inbox = req.nextUrl.searchParams.get('inbox') === 'true'

    if (path) {
      // Get single file by path
      const file = await prisma.file.findUnique({
        where: { path },
        include: {
          sections: { orderBy: { id: 'asc' } },
          tags: { include: { tag: true } },
        },
      })

      if (!file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }

      return NextResponse.json({ file })
    }

    // List files
    const whereClause = inbox
      ? { path: { startsWith: '00_Inbox/' } }
      : {}

    const files = await prisma.file.findMany({
      where: whereClause,
      include: {
        tags: { include: { tag: true } },
        sections: { take: 1, orderBy: { id: 'asc' } },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ files })
  } catch (error) {
    console.error('Files API error:', error)
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}
