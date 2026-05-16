# Berkshire Intelligence

AI-powered Retrieval-Augmented Generation (RAG) application for exploring and querying Berkshire Hathaway shareholder letters (2019–2024).

Built using:
- Next.js
- Mastra
- Ollama
- PostgreSQL + pgvector
- llama3.1:8b
- nomic-embed-text embeddings

---

## Overview

Berkshire Intelligence is a conversational AI system designed to answer questions about Warren Buffett’s investment philosophy, Berkshire Hathaway’s capital allocation strategies, market commentary, and long-term business principles using Berkshire Hathaway shareholder letters as the knowledge source.

The system uses a Retrieval-Augmented Generation (RAG) pipeline:

```text
PDFs
↓
Text Extraction
↓
Chunking
↓
Embeddings
↓
pgvector Storage
↓
Similarity Search
↓
LLM Grounded Response
↓
Streaming Chat UI
````

---

## Features

* PDF ingestion pipeline
* Semantic vector search using pgvector
* Conversational RAG chat experience
* Streaming AI responses
* Source attribution / citations
* Context-aware follow-up questions
* Ollama local LLM integration
* Modular Mastra-based architecture
* Responsive frontend UI

---

## Tech Stack

### Frontend

* Next.js App Router
* TypeScript
* TailwindCSS

### Backend / AI

* Mastra
* Ollama
* llama3.1:8b
* nomic-embed-text

### Database

* PostgreSQL
* pgvector
* Neon PostgreSQL

---

## Architecture

```text
frontend/
 └── Next.js Chat UI

src/mastra/
 ├── agents/
 ├── rag/
 ├── db/
 ├── tools/
 ├── workflows/
 └── lib/
```

---

## RAG Pipeline

### 1. PDF Ingestion

Berkshire shareholder letters are parsed using `pdf-parse`.

### 2. Chunking

Documents are split into semantic chunks:

```text
Chunk Size: 700
Overlap: 150
```

### 3. Embeddings

Embeddings are generated using:

```text
nomic-embed-text
```

### 4. Vector Storage

Chunks are stored in PostgreSQL using pgvector.

### 5. Retrieval

User queries are embedded and matched against stored vectors using cosine similarity search.

### 6. Response Generation

Relevant chunks are injected into the LLM context for grounded answer generation.

---

## Project Structure

```text
berkshire-intelligence/
│
├── frontend/
│
├── src/
│   └── mastra/
│       ├── agents/
│       ├── rag/
│       ├── db/
│       ├── lib/
│       ├── tools/
│       ├── workflows/
│       ├── types/
│       └── data/
│
├── .env
├── package.json
└── README.md
```

---

## Installation

### 1. Clone Repository

```bash
git clone <repo-url>
cd berkshire-intelligence
```

### 2. Install Dependencies

#### Root

```bash
npm install
```

#### Frontend

```bash
cd frontend
npm install
```

---

## Environment Variables

Create `.env` in the project root:

```env
DATABASE_URL=
OLLAMA_BASE_URL=http://localhost:11434
```

---

## Database Setup

### Enable pgvector

Run in PostgreSQL:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Create Documents Table

```sql
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  content TEXT,
  embedding vector(768),
  metadata JSONB
);
```

---

## Ollama Setup

Install Ollama:

https://ollama.com/download

### Pull Models

```bash
ollama pull llama3.1:8b
ollama pull nomic-embed-text
```

### Start Ollama

```bash
ollama serve
```

---

## Running The Application

### Terminal 1 — Mastra Backend

```bash
npm run dev
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

---

## PDF Ingestion

Place Berkshire shareholder letters inside:

```text
src/mastra/data/pdfs/
```

Files used:

```text
2019.pdf
2020.pdf
2021.pdf
2022.pdf
2023.pdf
2024.pdf
```

### Run Ingestion

```bash
npx tsx src/mastra/rag/ingest.ts
```

---

## Example Questions

* What is Buffett’s investment philosophy?
* What does Buffett think about diversification?
* How has Berkshire’s strategy evolved over time?
* What does Buffett say about market volatility?
* Why does Buffett avoid speculation?

---

## Testing

The application was tested for:

* RAG retrieval accuracy
* Conversational memory
* Follow-up question understanding
* Source attribution
* Streaming response performance
* Retrieval quality
* Error handling

---

## Retrieval Improvements

Implemented improvements include:

* Smaller semantic chunks
* Noise filtering during ingestion
* Context-aware conversational retrieval
* Source deduplication
* Query rewriting
* Improved prompt engineering

---

## Deployment Notes

Frontend deployment is supported via Vercel.

Current development setup uses local Ollama models.

For production deployment, the architecture supports:

* Hosted LLM APIs
* Self-hosted inference servers
* GPU cloud providers

---

## Future Improvements

* Hybrid search (BM25 + vector)
* Advanced reranking
* Persistent conversation memory
* Citation page references
* Multi-agent workflows
* Evaluation pipelines

---

## Acknowledgements

* Berkshire Hathaway Shareholder Letters
* Warren Buffett & Charlie Munger
* Mastra
* Ollama
* PostgreSQL
* Next.js

```
```
<img width="1899" height="912" alt="image" src="https://github.com/user-attachments/assets/1e620c2d-3f22-4d69-b660-8fd2fc1a7678" />

<img width="1899" height="873" alt="image" src="https://github.com/user-attachments/assets/8c3da686-f028-4745-9619-aec7baa29b4d" />

