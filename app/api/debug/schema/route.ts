import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Get all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    ` as { table_name: string }[]

    // Get columns for files table
    const fileColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'files'
      ORDER BY ordinal_position
    ` as { column_name: string; data_type: string; is_nullable: string }[]

    // Get columns for conversations table
    const conversationColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'conversations'
      ORDER BY ordinal_position
    ` as { column_name: string; data_type: string; is_nullable: string }[]

    return NextResponse.json({
      tables: tables.map(t => t.table_name),
      fileColumns: fileColumns.map(c => ({
        name: c.column_name,
        type: c.data_type,
        nullable: c.is_nullable === 'YES'
      })),
      conversationColumns: conversationColumns.map(c => ({
        name: c.column_name,
        type: c.data_type,
        nullable: c.is_nullable === 'YES'
      }))
    })
  } catch (error) {
    console.error('Schema check error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
