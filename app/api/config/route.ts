import { NextResponse } from 'next/server'

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000'

// Configuration for available AI providers and models
// These can be extended based on environment variables

interface ModelConfig {
  id: string
  name: string
  provider: string
  available: boolean
}

interface ProviderConfig {
  id: string
  name: string
  available: boolean
  models: ModelConfig[]
}

interface RAGTechnique {
  id: string
  name: string
  description: string
}

export async function GET() {
  // Try to fetch config from Python backend first
  try {
    const response = await fetch(`${PYTHON_API_URL}/config`, {
      headers: { 'Content-Type': 'application/json' },
      // Short timeout to fall back quickly if backend is down
      signal: AbortSignal.timeout(2000),
    })
    
    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data)
    }
  } catch {
    // Backend not available, use frontend fallback config
    console.log('Python backend not available, using fallback config')
  }

  // Fallback: Check which providers are configured via environment variables
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  const hasGemini = !!process.env.GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY
  const hasOllama = !!process.env.OLLAMA_URL || process.env.OLLAMA_ENABLED === 'true'

  const providers: ProviderConfig[] = [
    {
      id: 'ollama',
      name: 'Ollama (Local)',
      available: hasOllama || true, // Default to available for local dev
      models: [
        { id: 'llama3.2', name: 'Llama 3.2', provider: 'ollama', available: true },
        { id: 'llama3.1', name: 'Llama 3.1', provider: 'ollama', available: true },
        { id: 'mistral', name: 'Mistral', provider: 'ollama', available: true },
        { id: 'codellama', name: 'Code Llama', provider: 'ollama', available: true },
        { id: 'phi3', name: 'Phi-3', provider: 'ollama', available: true },
      ],
    },
    {
      id: 'openai',
      name: 'OpenAI',
      available: hasOpenAI,
      models: [
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', available: hasOpenAI },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', available: hasOpenAI },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', available: hasOpenAI },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', available: hasOpenAI },
      ],
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      available: hasGemini,
      models: [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini', available: hasGemini },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini', available: hasGemini },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'gemini', available: hasGemini },
      ],
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      available: hasAnthropic,
      models: [
        { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', available: hasAnthropic },
        { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', available: hasAnthropic },
        { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'anthropic', available: hasAnthropic },
      ],
    },
  ]

  const ragTechniques: RAGTechnique[] = [
    {
      id: 'basic',
      name: 'Basic RAG',
      description: 'Simple semantic search and retrieval',
    },
    {
      id: 'hybrid',
      name: 'Hybrid Search',
      description: 'Combines semantic and keyword search',
    },
    {
      id: 'rerank',
      name: 'Re-ranking',
      description: 'Uses a reranker model to improve results',
    },
    {
      id: 'hyde',
      name: 'HyDE',
      description: 'Hypothetical Document Embeddings',
    },
    {
      id: 'multi-query',
      name: 'Multi-Query',
      description: 'Generates multiple queries for better coverage',
    },
  ]

  return NextResponse.json({
    providers: providers.filter(p => p.available),
    allProviders: providers,
    ragTechniques,
    hasPythonBackend: false, // Backend not available, using fallback
    defaults: {
      provider: hasOllama || true ? 'ollama' : hasOpenAI ? 'openai' : 'ollama',
      model: 'qwen3:30b',
      ragTechnique: 'hybrid',
    },
    // Fields required by BACKEND_API_SPEC.md
    embedding_model: 'not-configured',
    vector_store: 'not-configured',
  })
}
