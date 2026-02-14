import createClient from 'openapi-fetch';
import type { paths, components } from './api-types';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'https://brain.nikolayvalev.com';
const BRAIN_API_KEY = process.env.BRAIN_API_KEY || '';

/**
 * Type-safe API client for the Second Brain Python backend.
 * 
 * All API requests (except /health, /docs, /redoc, /openapi.json) require 
 * authentication via the X-API-Key header.
 * 
 * Usage:
 * ```ts
 * const { data, error } = await api.POST('/ask', {
 *   body: { question: 'What is...' }
 * });
 * ```
 */
export const api = createClient<paths>({
  baseUrl: PYTHON_API_URL,
  headers: BRAIN_API_KEY ? { 'X-API-Key': BRAIN_API_KEY } : {},
});

// Re-export types for convenience
export type AskRequest = components['schemas']['AskRequest'];
export type AskResponse = components['schemas']['AskResponse'];
export type SourceInfo = components['schemas']['Source'];
export type SearchResponse = components['schemas']['SearchResponse'];
export type SearchResult = components['schemas']['SearchResult'];
export type SemanticSearchRequest = components['schemas']['SemanticSearchRequest'];
export type SemanticSearchResponse = components['schemas']['SemanticSearchResponse'];
export type SemanticSearchResult = components['schemas']['SemanticSearchResult'];
export type ConfigResponse = components['schemas']['ConfigResponse'];
export type ConfigDefaults = components['schemas']['ConfigDefaults'];
export type ProviderInfo = components['schemas']['ProviderInfo'];
export type ProviderModel = components['schemas']['ProviderModel'];
export type RAGTechniqueInfo = components['schemas']['RAGTechniqueInfo'];
export type HealthResponse = components['schemas']['HealthResponse'];
export type StatsResponse = components['schemas']['StatsResponse'];
export type IndexRequest = components['schemas']['IndexRequest'];
export type IndexResponse = components['schemas']['IndexResponse'];
export type IndexStatusResponse = components['schemas']['IndexStatusResponse'];
export type InboxFileInfo = components['schemas']['InboxFileInfo'];
export type InboxFolderInfo = components['schemas']['InboxFolderInfo'];
export type InboxContentsResponse = components['schemas']['InboxContentsResponse'];
export type InboxProcessRequest = components['schemas']['InboxProcessRequest'];
export type InboxProcessResponse = components['schemas']['InboxProcessResponse'];
export type FileResponse = components['schemas']['FileResponse'];
export type EmbeddingStatsResponse = components['schemas']['EmbeddingStatsResponse'];
