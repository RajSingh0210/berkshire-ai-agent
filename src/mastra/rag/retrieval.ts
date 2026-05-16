import { getDb } from '../db/postgres';
import { ensureDocumentsSchema } from '../db/schema';
import { embedText, toPgVector } from './embeddings';
import { rewriteQueryForRetrieval } from './query-rewriter';
import { rerankChunks } from './rerank';
import type { Citation, RetrievedChunk } from './types';

/** Vector search candidate count before reranking. */
export const VECTOR_SEARCH_TOP_K = 10;

/** Final chunks passed to the answer prompt after reranking. */
export const RERANK_OUTPUT_TOP_K = 5;

interface DocumentRow {
  id: number;
  content: string;
  metadata: {
    source: string;
    year: number;
    chunkIndex: number;
    page?: number;
  };
  score: number;
}

export async function retrieveRelevantChunks(query: string): Promise<RetrievedChunk[]> {
  await ensureDocumentsSchema();

  const rewrittenQuery = await rewriteQueryForRetrieval(query);
  const embedding = await embedText(rewrittenQuery);
  const db = getDb();

  const result = await db.query<DocumentRow>(
    `
      SELECT
        id,
        content,
        metadata,
        1 - (embedding <=> $1::vector) AS score
      FROM documents
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `,
    [toPgVector(embedding), VECTOR_SEARCH_TOP_K],
  );

  const candidates = result.rows.map((row) => ({
    id: row.id,
    content: row.content,
    metadata: row.metadata,
    score: Number(row.score),
  }));

  const diversified = diversifyChunks(candidates, VECTOR_SEARCH_TOP_K);
  return rerankChunks(query, diversified, RERANK_OUTPUT_TOP_K);
}

export function buildRagContext(chunks: RetrievedChunk[]): string {
  return chunks
    .map((chunk) => {
      const label = formatCitationLabel(chunk.metadata.year, chunk.metadata.page ? [chunk.metadata.page] : undefined);
      return `SOURCE: ${label}\n\nCONTENT:\n${chunk.content.trim()}`;
    })
    .join('\n\n---\n\n');
}

/** One entry per retrieved excerpt for the UI. */
export function buildCitations(chunks: RetrievedChunk[]): Citation[] {
  return chunks.map((chunk, index) => ({
    index: index + 1,
    source: chunk.metadata.source,
    year: chunk.metadata.year,
    label: formatCitationLabel(chunk.metadata.year, chunk.metadata.page ? [chunk.metadata.page] : undefined),
    shortLabel: formatShortLetterLabel(chunk.metadata.year),
    chunkIndexes: [chunk.metadata.chunkIndex],
    pages: chunk.metadata.page ? [chunk.metadata.page] : undefined,
    score: Number(chunk.score.toFixed(4)),
  }));
}

function diversifyChunks(chunks: RetrievedChunk[], topK: number): RetrievedChunk[] {
  const selected: RetrievedChunk[] = [];
  const sourceCounts = new Map<string, number>();

  for (const chunk of chunks) {
    if (selected.length >= topK) {
      break;
    }

    if (isNearDuplicate(chunk, selected)) {
      continue;
    }

    const sourceKey = `${chunk.metadata.source}:${chunk.metadata.year}`;
    const sourceCount = sourceCounts.get(sourceKey) ?? 0;

    if (sourceCount >= 3 && chunks.length > topK) {
      continue;
    }

    selected.push(chunk);
    sourceCounts.set(sourceKey, sourceCount + 1);
  }

  if (selected.length >= topK) {
    return selected;
  }

  for (const chunk of chunks) {
    if (selected.length >= topK) {
      break;
    }

    if (!selected.some((selectedChunk) => selectedChunk.id === chunk.id)) {
      selected.push(chunk);
    }
  }

  return selected;
}

function isNearDuplicate(chunk: RetrievedChunk, selected: RetrievedChunk[]): boolean {
  return selected.some((selectedChunk) => {
    const sameSource = selectedChunk.metadata.source === chunk.metadata.source;
    const neighboringChunk = Math.abs(selectedChunk.metadata.chunkIndex - chunk.metadata.chunkIndex) <= 1;
    return sameSource && neighboringChunk;
  });
}

function formatShareholderLetterLabel(year: number): string {
  return `${year} Shareholder Letter`;
}

export function formatShortLetterLabel(year: number): string {
  return `${year} letter`;
}

function formatCitationLabel(year: number, pages?: number[]): string {
  const base = formatShareholderLetterLabel(year);
  if (!pages?.length) {
    return base;
  }

  return pages.length === 1 ? `${base} - Page ${pages[0]}` : `${base} - Pages ${pages.join(', ')}`;
}
