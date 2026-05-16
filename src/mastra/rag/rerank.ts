import { CHAT_MODEL, getOllamaClient } from '../lib/ollama';
import type { RetrievedChunk } from './types';

const RERANK_TIMEOUT_MS = 20_000;

/**
 * Reranks vector-search candidates with the chat model; returns top `limit` chunks.
 */
export async function rerankChunks(
  question: string,
  candidates: RetrievedChunk[],
  limit: number,
): Promise<RetrievedChunk[]> {
  if (candidates.length === 0) {
    return [];
  }

  if (candidates.length <= limit) {
    return candidates;
  }

  try {
    const rankedIndexes = await rankChunkIndexes(question, candidates);
    const selected: RetrievedChunk[] = [];
    const used = new Set<number>();

    for (const index of rankedIndexes) {
      if (index < 0 || index >= candidates.length || used.has(index)) {
        continue;
      }
      used.add(index);
      selected.push(candidates[index]);
      if (selected.length >= limit) {
        break;
      }
    }

    if (selected.length >= limit) {
      return selected;
    }

    for (let i = 0; i < candidates.length && selected.length < limit; i += 1) {
      if (!used.has(i)) {
        selected.push(candidates[i]);
      }
    }

    return selected;
  } catch {
    return candidates.slice(0, limit);
  }
}

async function rankChunkIndexes(question: string, candidates: RetrievedChunk[]): Promise<number[]> {
  const chunkSummaries = candidates
    .map((chunk, index) => {
      const preview = chunk.content.replace(/\s+/g, ' ').trim().slice(0, 400);
      return `[${index}] (${chunk.metadata.year} letter) ${preview}`;
    })
    .join('\n\n');

  const response = await Promise.race([
    getOllamaClient().chat({
      model: CHAT_MODEL,
      stream: false,
      format: 'json',
      messages: [
        {
          role: 'system',
          content:
            'You rank retrieved Berkshire Hathaway shareholder letter chunks by relevance to a user question. Respond with JSON only.',
        },
        {
          role: 'user',
          content: `
QUESTION:
${question}

CHUNKS:
${chunkSummaries}

Select the chunk indexes that best answer the question. Prioritize Buffett's investment principles, business strategy, capital allocation, and direct explanations.

Avoid indexes that are mainly: performance tables, S&P 500 comparisons, shareholder meeting logistics, bazaar announcements, or unrelated statistics.

Return JSON: {"indexes": [0, 3, 1, ...]} with at most 5 indexes, best first.
`.trim(),
        },
      ],
    }),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Rerank timed out')), RERANK_TIMEOUT_MS);
    }),
  ]);

  const raw = response.message.content?.trim() ?? '';
  const parsed = JSON.parse(raw) as { indexes?: unknown };
  const indexes = Array.isArray(parsed.indexes)
    ? parsed.indexes
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value >= 0)
    : [];

  return indexes;
}
