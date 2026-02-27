import { api } from './api-client';
import type {
  AskRequest,
  AskResponse,
  InboxContentsResponse,
  InboxFileInfo,
  InboxProcessResponse,
  SemanticSearchResponse,
  ConfigResponse,
  HealthResponse,
  IndexRequest,
  IndexResponse,
  IndexStatusResponse,
} from './api-client';

// Re-export types for backwards compatibility
export type { AskRequest, AskResponse, SourceInfo } from './api-client';

/**
 * Ask a question with RAG-enhanced responses
 */
export async function askQuestion(request: AskRequest): Promise<AskResponse> {
  const { data, error } = await api.POST('/ask', {
    body: {
      question: request.question,
      conversation_id: request.conversation_id,
      provider: request.provider,
      model: request.model,
      rag_technique: request.rag_technique,
      system_prompt: request.system_prompt,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      top_p: request.top_p,
      top_k: request.top_k,
      include_sources: request.include_sources ?? true,
      stream: request.stream ?? false,
    },
  });

  if (error) {
    throw new Error(`API error: ${JSON.stringify(error)}`);
  }

  return data;
}

/**
 * Semantic search without LLM response generation
 */
export async function searchSemantic(
  query: string,
  limit: number = 10,
  ragTechnique: string = 'hybrid'
): Promise<SemanticSearchResponse> {
  const { data, error } = await api.POST('/search', {
    body: { query, limit, rag_technique: ragTechnique },
  });

  if (error) {
    throw new Error(`API error: ${JSON.stringify(error)}`);
  }

  return data;
}

/**
 * Get available providers, models, and RAG techniques
 */
export async function getConfig(): Promise<ConfigResponse> {
  const { data, error } = await api.GET('/config');

  if (error) {
    throw new Error(`API error: ${JSON.stringify(error)}`);
  }

  return data;
}

/**
 * Health check endpoint
 */
export async function getHealth(): Promise<HealthResponse> {
  const { data, error } = await api.GET('/health');

  if (error) {
    throw new Error(`API error: ${JSON.stringify(error)}`);
  }

  return data;
}

/**
 * Trigger document indexing
 */
export async function triggerIndex(request?: IndexRequest): Promise<IndexResponse> {
  const { data, error } = await api.POST('/index', {
    body: {
      paths: request?.paths ?? null,
      force: request?.force ?? false,
    },
  });

  if (error) {
    throw new Error(`API error: ${JSON.stringify(error)}`);
  }

  return data;
}

/**
 * Get indexing status
 */
export async function getIndexStatus(): Promise<IndexStatusResponse> {
  const { data, error } = await api.GET('/index/status');

  if (error) {
    throw new Error(`API error: ${JSON.stringify(error)}`);
  }

  return data;
}

/**
 * Get inbox folder contents (files and folders)
 * Uses the local Next.js API route which proxies to the Python backend
 */
export async function getInboxContents(): Promise<InboxContentsResponse> {
  const res = await fetch('/api/inbox?action=contents');
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || error.error || 'Failed to fetch inbox contents');
  }

  return res.json();
}

/**
 * Get flat list of inbox files
 * Uses the local Next.js API route which proxies to the Python backend
 */
export async function getInboxFiles(): Promise<InboxFileInfo[]> {
  const res = await fetch('/api/inbox?action=files');
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || error.error || 'Failed to fetch inbox files');
  }

  return res.json();
}

/**
 * Process inbox files (move to vault)
 * Uses the local Next.js API route which proxies to the Python backend
 */
export async function processInbox(dryRun: boolean = false): Promise<InboxProcessResponse> {
  const res = await fetch('/api/inbox', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dry_run: dryRun }),
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || error.error || 'Failed to process inbox');
  }

  return res.json();
}
