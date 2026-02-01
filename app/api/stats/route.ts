import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [totalFiles, totalSections, totalTags, inboxCount] = await prisma.$transaction([
      prisma.file.count(),
      prisma.section.count(),
      prisma.tag.count(),
      prisma.file.count({ where: { path: { startsWith: '00_Inbox/' } } }),
    ])

    return NextResponse.json({
      totalFiles,
      totalSections,
      totalTags,
      inboxCount,
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
