/* eslint-disable @typescript-eslint/no-require-imports */
const http = require('http')
const { URL } = require('url')

const PORT = 8787

let nextConversationId = 100
const conversations = new Map()

function nowIso() {
  return new Date().toISOString()
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(payload))
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => {
      if (!data) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(data))
      } catch {
        resolve({})
      }
    })
  })
}

function ensureConversation(id, title) {
  const key = String(id)
  if (!conversations.has(key)) {
    conversations.set(key, {
      id: key,
      title: title || 'New conversation',
      created_at: nowIso(),
      updated_at: nowIso(),
      messages: [],
    })
  }
  return conversations.get(key)
}

function handleAsk(body, res) {
  const question = String(body.question || '')
  const conversationId =
    body.conversation_id !== undefined && body.conversation_id !== null
      ? String(body.conversation_id)
      : String(nextConversationId++)
  const conversation = ensureConversation(conversationId, question.slice(0, 60))

  const answer = 'Your current priorities are shipping stable backend/frontend integration.'
  const source = {
    path: 'Projects/Plan.md',
    title: 'Plan',
    snippet: 'Top priorities this week...',
    score: 0.93,
  }

  conversation.messages.push({
    id: conversation.messages.length + 1,
    role: 'user',
    content: question,
    created_at: nowIso(),
  })
  conversation.messages.push({
    id: conversation.messages.length + 1,
    role: 'assistant',
    content: answer,
    sources: [source],
    created_at: nowIso(),
  })
  conversation.updated_at = nowIso()

  if (body.stream) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    res.write(`data: ${JSON.stringify({ type: 'source', source })}\n\n`)
    res.write(`data: ${JSON.stringify({ type: 'token', content: 'Your current priorities are ' })}\n\n`)
    res.write(`data: ${JSON.stringify({ type: 'token', content: 'shipping stable backend/frontend integration.' })}\n\n`)
    res.write(`data: ${JSON.stringify({ type: 'done', conversation_id: conversationId, model_used: body.model || 'gpt-4o-mini' })}\n\n`)
    res.end()
    return
  }

  sendJson(res, 200, {
    answer,
    sources: [source],
    conversation_id: conversationId,
    model_used: body.model || 'gpt-4o-mini',
    tokens_used: { prompt: 100, completion: 30, total: 130 },
  })
}

function handleSearch(url, method, body, res) {
  if (method === 'GET') {
    const q = String(url.searchParams.get('q') || '')
    if (!q) {
      sendJson(res, 400, { detail: 'Query cannot be empty' })
      return
    }
    sendJson(res, 200, {
      query: q,
      count: 1,
      results: [
        {
          file_path: 'Security/API.md',
          title: 'API Security',
          heading: 'Middleware',
          snippet: 'Use API key middleware...',
          rank: 1,
        },
      ],
    })
    return
  }

  sendJson(res, 200, {
    results: [
      {
        path: 'Security/OAuth.md',
        title: 'OAuth Architecture',
        snippet: 'OAuth middleware and token exchange...',
        score: 0.89,
        metadata: {
          tags: ['security', 'auth'],
          created_at: nowIso(),
          updated_at: nowIso(),
        },
      },
    ],
    query_embedding_time_ms: 20,
    search_time_ms: 15,
  })
}

function handleConversations(url, method, body, res) {
  if (method === 'GET') {
    const pathParts = url.pathname.split('/').filter(Boolean)
    if (pathParts.length === 1) {
      const list = Array.from(conversations.values())
      sendJson(res, 200, { conversations: list, count: list.length })
      return
    }

    if (pathParts.length === 2) {
      const id = pathParts[1]
      const conversation = conversations.get(String(id))
      if (!conversation) {
        sendJson(res, 404, { detail: 'Conversation not found' })
        return
      }
      sendJson(res, 200, { conversation })
      return
    }

    if (pathParts.length === 3 && pathParts[2] === 'messages') {
      const id = pathParts[1]
      const conversation = conversations.get(String(id))
      if (!conversation) {
        sendJson(res, 404, { detail: 'Conversation not found' })
        return
      }
      conversation.messages.push({
        id: conversation.messages.length + 1,
        role: body.role || 'user',
        content: body.content || '',
        created_at: nowIso(),
      })
      conversation.updated_at = nowIso()
      sendJson(res, 200, { ok: true })
      return
    }
  }

  if (method === 'POST') {
    const id = String(nextConversationId++)
    const conversation = ensureConversation(id, body.title || 'New conversation')
    sendJson(res, 200, conversation)
    return
  }

  sendJson(res, 405, { detail: 'Method not allowed' })
}

const server = http.createServer(async (req, res) => {
  const method = req.method || 'GET'
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`)
  const body = method === 'POST' ? await readBody(req) : {}

  if (url.pathname === '/health') {
    sendJson(res, 200, { status: 'ok', version: '1.0.0', vault_path: '/tmp', watcher_running: true, providers: {} })
    return
  }

  if (url.pathname === '/config') {
    sendJson(res, 200, {
      providers: [
        {
          id: 'openai',
          name: 'OpenAI',
          available: true,
          models: [
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', available: true, context_length: 128000 },
          ],
        },
      ],
      rag_techniques: [
        { id: 'basic', name: 'Basic', description: 'Basic retrieval' },
        { id: 'hybrid', name: 'Hybrid', description: 'Hybrid retrieval' },
      ],
      defaults: { provider: 'openai', model: 'gpt-4o-mini', rag_technique: 'hybrid' },
      embedding_model: 'test-embed',
      vector_store: 'sqlite',
    })
    return
  }

  if (url.pathname === '/stats') {
    sendJson(res, 200, {
      file_count: 12,
      section_count: 34,
      tag_count: 5,
      link_count: 8,
      last_indexed: nowIso(),
    })
    return
  }

  if (url.pathname === '/search') {
    handleSearch(url, method, body, res)
    return
  }

  if (url.pathname === '/ask' && method === 'POST') {
    handleAsk(body, res)
    return
  }

  if (url.pathname.startsWith('/conversations')) {
    handleConversations(url, method, body, res)
    return
  }

  if (url.pathname === '/inbox/contents') {
    sendJson(res, 200, {
      inbox_path: '00_Inbox',
      total_files: 0,
      total_folders: 0,
      root_files: [],
      folders: [],
    })
    return
  }

  if (url.pathname === '/inbox/files') {
    sendJson(res, 200, [])
    return
  }

  if (url.pathname === '/inbox/process' && method === 'POST') {
    sendJson(res, 200, { processed: 0, moved: 0, skipped: 0, errors: 0, results: [] })
    return
  }

  sendJson(res, 404, { detail: 'Not found' })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Mock backend listening at http://127.0.0.1:${PORT}`)
})
