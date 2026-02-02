# Second Brain Backend API Specification

## Overview

This document defines the API contract between the Next.js frontend and the Python backend. All AI/LLM logic should live in the backend. The frontend is responsible only for UI and will pass user selections for provider, model, and RAG technique to the backend.

**Base URL:** `http://localhost:8000` (configurable via `PYTHON_API_URL` env var)

---

## Endpoints

### 1. POST `/ask` - Main RAG Query Endpoint

The primary endpoint for asking questions with RAG-enhanced responses.

#### Request

```json
{
  "question": "string (required) - The user's question",
  "conversation_id": "string | null - Optional conversation ID for context",
  "provider": "string - AI provider to use (ollama, openai, gemini, anthropic)",
  "model": "string - Specific model ID to use",
  "rag_technique": "string - RAG technique to apply (basic, hybrid, rerank, hyde, multi-query)"
}
```

#### Response

```json
{
  "answer": "string - The AI-generated answer",
  "sources": [
    {
      "path": "string - File path or note ID",
      "title": "string - Document/note title",
      "snippet": "string - Relevant excerpt from the source",
      "score": "number - Relevance score (0-1)"
    }
  ],
  "conversation_id": "string - Conversation ID (new or existing)",
  "model_used": "string - Actual model that was used",
  "tokens_used": {
    "prompt": "number",
    "completion": "number",
    "total": "number"
  }
}
```

#### Error Response

```json
{
  "error": "string - Error message",
  "code": "string - Error code (PROVIDER_UNAVAILABLE, MODEL_NOT_FOUND, RAG_ERROR, etc.)"
}
```

---

### 2. GET `/config` - Get Available Configuration

Returns available providers, models, and RAG techniques based on backend configuration.

#### Response

```json
{
  "providers": [
    {
      "id": "ollama",
      "name": "Ollama (Local)",
      "available": true,
      "base_url": "http://localhost:11434",
      "models": [
        {
          "id": "llama3.2",
          "name": "Llama 3.2",
          "context_length": 128000,
          "available": true
        }
      ]
    },
    {
      "id": "openai",
      "name": "OpenAI",
      "available": true,
      "models": [
        {
          "id": "gpt-4o",
          "name": "GPT-4o",
          "context_length": 128000,
          "available": true
        }
      ]
    }
  ],
  "rag_techniques": [
    {
      "id": "basic",
      "name": "Basic RAG",
      "description": "Simple semantic search and retrieval"
    },
    {
      "id": "hybrid",
      "name": "Hybrid Search",
      "description": "Combines semantic and keyword search (BM25 + embeddings)"
    },
    {
      "id": "rerank",
      "name": "Re-ranking",
      "description": "Uses a cross-encoder reranker model to improve results"
    },
    {
      "id": "hyde",
      "name": "HyDE",
      "description": "Hypothetical Document Embeddings - generates hypothetical answer first"
    },
    {
      "id": "multi-query",
      "name": "Multi-Query",
      "description": "Generates multiple query variations for better coverage"
    }
  ],
  "defaults": {
    "provider": "ollama",
    "model": "llama3.2",
    "rag_technique": "basic"
  },
  "embedding_model": "string - Current embedding model in use",
  "vector_store": "string - Vector store type (chroma, pgvector, qdrant, etc.)"
}
```

---

### 3. GET `/health` - Health Check

#### Response

```json
{
  "status": "ok",
  "version": "1.0.0",
  "providers": {
    "ollama": { "available": true, "models_loaded": ["llama3.2"] },
    "openai": { "available": true },
    "gemini": { "available": false, "error": "API key not configured" },
    "anthropic": { "available": false, "error": "API key not configured" }
  },
  "vector_store": {
    "type": "chroma",
    "documents_indexed": 1234
  }
}
```

---

### 4. POST `/index` - Index/Re-index Documents

Trigger document indexing for the knowledge base.

#### Request

```json
{
  "paths": ["string[] | null - Specific paths to index, null for all"],
  "force": "boolean - Force re-indexing even if unchanged"
}
```

#### Response

```json
{
  "status": "started",
  "job_id": "string - Job ID for tracking",
  "documents_queued": 42
}
```

---

### 5. GET `/index/status` - Get Indexing Status

#### Response

```json
{
  "status": "idle | indexing | error",
  "documents_indexed": 1234,
  "documents_pending": 0,
  "last_indexed_at": "2026-02-01T12:00:00Z",
  "current_job": {
    "job_id": "string",
    "progress": 0.75,
    "documents_processed": 30,
    "documents_total": 40
  }
}
```

---

### 6. POST `/search` - Semantic Search (without LLM)

Direct semantic search without generating an answer.

#### Request

```json
{
  "query": "string - Search query",
  "limit": "number - Max results (default: 10)",
  "rag_technique": "string - Technique to use for retrieval"
}
```

#### Response

```json
{
  "results": [
    {
      "path": "string",
      "title": "string",
      "snippet": "string",
      "score": 0.95,
      "metadata": {
        "tags": ["string"],
        "created_at": "string",
        "updated_at": "string"
      }
    }
  ],
  "query_embedding_time_ms": 45,
  "search_time_ms": 12
}
```

---

## RAG Techniques Implementation Guide

### 1. Basic RAG
```
1. Embed the user query
2. Retrieve top-k similar documents from vector store
3. Construct prompt with retrieved context
4. Generate answer with LLM
```

### 2. Hybrid Search
```
1. Embed the user query (dense retrieval)
2. Run BM25/keyword search (sparse retrieval)
3. Combine results using Reciprocal Rank Fusion (RRF)
4. Construct prompt with merged context
5. Generate answer with LLM
```

### 3. Re-ranking
```
1. Embed the user query
2. Retrieve top-k*3 similar documents
3. Re-rank with cross-encoder model (e.g., ms-marco-MiniLM)
4. Take top-k after re-ranking
5. Generate answer with LLM
```

### 4. HyDE (Hypothetical Document Embeddings)
```
1. Generate hypothetical answer using LLM (without context)
2. Embed the hypothetical answer
3. Retrieve documents similar to hypothetical answer
4. Generate final answer with retrieved context
```

### 5. Multi-Query
```
1. Generate 3-5 query variations using LLM
2. Retrieve documents for each query variation
3. Deduplicate and merge results
4. Generate answer with combined context
```

---

## Provider Configuration

The backend should support these providers via environment variables:

```bash
# Ollama (Local)
OLLAMA_URL=http://localhost:11434
OLLAMA_ENABLED=true

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_ORG_ID=org-...  # optional

# Google Gemini
GOOGLE_API_KEY=...
# or
GEMINI_API_KEY=...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Embedding Model
EMBEDDING_MODEL=text-embedding-3-small  # or local model
EMBEDDING_PROVIDER=openai  # openai, ollama, sentence-transformers

# Vector Store
VECTOR_STORE_TYPE=chroma  # chroma, pgvector, qdrant
VECTOR_STORE_URL=...  # if remote

# Reranker (for rerank technique)
RERANKER_MODEL=cross-encoder/ms-marco-MiniLM-L-6-v2
```

---

## Example Python Backend Structure

```
backend/
├── main.py                 # FastAPI app entry
├── config.py               # Configuration management
├── routers/
│   ├── ask.py              # /ask endpoint
│   ├── config.py           # /config endpoint
│   ├── search.py           # /search endpoint
│   └── index.py            # /index endpoints
├── services/
│   ├── llm/
│   │   ├── base.py         # Abstract LLM interface
│   │   ├── ollama.py       # Ollama provider
│   │   ├── openai.py       # OpenAI provider
│   │   ├── gemini.py       # Gemini provider
│   │   └── anthropic.py    # Anthropic provider
│   ├── rag/
│   │   ├── base.py         # Abstract RAG interface
│   │   ├── basic.py        # Basic RAG
│   │   ├── hybrid.py       # Hybrid search
│   │   ├── rerank.py       # Re-ranking
│   │   ├── hyde.py         # HyDE
│   │   └── multi_query.py  # Multi-query
│   ├── embeddings.py       # Embedding service
│   └── vector_store.py     # Vector store abstraction
├── models/
│   ├── request.py          # Pydantic request models
│   └── response.py         # Pydantic response models
└── requirements.txt
```

---

## Minimal FastAPI Skeleton

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Second Brain API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
from pydantic import BaseModel
from typing import Optional, List

class AskRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None
    provider: str = "ollama"
    model: str = "llama3.2"
    rag_technique: str = "basic"

class Source(BaseModel):
    path: str
    title: str
    snippet: str
    score: float

class AskResponse(BaseModel):
    answer: str
    sources: List[Source]
    conversation_id: Optional[str] = None
    model_used: str

@app.post("/ask")
async def ask(request: AskRequest) -> AskResponse:
    # 1. Get the appropriate RAG technique
    # 2. Retrieve relevant documents
    # 3. Get the appropriate LLM provider
    # 4. Generate answer with context
    # 5. Return response with sources
    pass

@app.get("/config")
async def get_config():
    # Return available providers, models, and techniques
    pass

@app.get("/health")
async def health():
    return {"status": "ok"}
```

---

## Frontend Integration

The frontend will call these endpoints. Here's what the frontend sends:

```typescript
// From app/api/ask/route.ts
const response = await fetch(`${PYTHON_API_URL}/ask`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    question, 
    conversation_id: conversationId,
    provider,        // "ollama" | "openai" | "gemini" | "anthropic"
    model,           // "llama3.2" | "gpt-4o" | etc.
    rag_technique,   // "basic" | "hybrid" | "rerank" | "hyde" | "multi-query"
  }),
})
```

The frontend currently has a fallback `/api/config` endpoint that returns static data. Once the backend implements `/config`, update the frontend to fetch from the backend instead.

---

## Priority Implementation Order

1. **MVP (Phase 1)**
   - `GET /health`
   - `GET /config` (return available providers/models)
   - `POST /ask` with basic RAG
   - Single provider (Ollama recommended for local dev)

2. **Phase 2**
   - Add more providers (OpenAI, Gemini)
   - Implement hybrid search
   - Add re-ranking

3. **Phase 3**
   - HyDE and multi-query techniques
   - Document indexing endpoints
   - Streaming responses (SSE)
