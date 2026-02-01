import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const conversationColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'conversations'
      ORDER BY ordinal_position
    ` as { column_name: string; data_type: string; is_nullable: string }[]

    const messageColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'messages'
      ORDER BY ordinal_position
    ` as { column_name: string; data_type: string; is_nullable: string }[]

    return NextResponse.json({
      conversationColumns: conversationColumns.map(c => ({
        name: c.column_name,
        type: c.data_type,
        nullable: c.is_nullable === 'YES'
      })),
      messageColumns: messageColumns.map(c => ({
        name: c.column_name,
        type: c.data_type,
        nullable: c.is_nullable === 'YES'
      }))
    })
  } catch (error) {
    console.error('Conversations schema check error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
