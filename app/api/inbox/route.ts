import { api } from '@/lib/api-client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action') || 'contents'

    if (action === 'contents') {
      const { data, error } = await api.GET('/inbox/contents')

      if (error) {
        console.error('Inbox contents error:', error)
        return NextResponse.json({ error: 'Failed to fetch inbox contents' }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    if (action === 'files') {
      const { data, error } = await api.GET('/inbox/files')

      if (error) {
        console.error('Inbox files error:', error)
        return NextResponse.json({ error: 'Failed to fetch inbox files' }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Inbox API error:', error)
    return NextResponse.json({ error: 'Failed to fetch inbox' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const dryRun = body.dry_run ?? false

    const { data, error } = await api.POST('/inbox/process', {
      body: { dry_run: dryRun },
    })

    if (error) {
      console.error('Inbox process error:', error)
      return NextResponse.json({ error: 'Failed to process inbox' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Inbox process API error:', error)
    return NextResponse.json({ error: 'Failed to process inbox' }, { status: 500 })
  }
}
