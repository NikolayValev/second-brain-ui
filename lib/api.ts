import { api } from './api-client';
import type {
  AskRequest,
  AskResponse,
  InboxContentsResponse,
  InboxFileInfo,
  InboxProcessResponse,
  SearchResponse,
  ConfigResponse,
  HealthResponse,
  IndexRequest,
  IndexResponse,
  IndexStatusResponse,
  SourceInfo,
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
      include_sources: request.include_sources ?? true,
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
export async function searchSemantic(query: string, limit: number = 10): Promise<SearchResponse> {
  const { data, error } = await api.GET('/search', {
    params: {
      query: { q: query, limit },
    },
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
 */
export async function getInboxContents(): Promise<InboxContentsResponse> {
  const { data, error } = await api.GET('/inbox/contents');

  if (error) {
    throw new Error(`API error: ${JSON.stringify(error)}`);
  }

  return data;
}

/**
 * Get flat list of inbox files
 */
export async function getInboxFiles(): Promise<InboxFileInfo[]> {
  const { data, error } = await api.GET('/inbox/files');

  if (error) {
    throw new Error(`API error: ${JSON.stringify(error)}`);
  }

  // The API returns an array of InboxFileInfo, but the type is not properly defined in the schema
  return data as InboxFileInfo[];
}

/**
 * Process inbox files (move to vault)
 */
export async function processInbox(dryRun: boolean = false): Promise<InboxProcessResponse> {
  const { data, error } = await api.POST('/inbox/process', {
    body: { dry_run: dryRun },
  });

  if (error) {
    throw new Error(`API error: ${JSON.stringify(error)}`);
  }

  return data;
}
