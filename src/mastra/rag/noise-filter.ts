import type { DocumentChunk } from './types';

const NOISE_PATTERNS = [
  'annual percentage change',
  's&p 500',
  'bazaar',
  'shareholder meeting',
  'meeting announcements',
  'percentage change',
  'performance table',
  'annual meeting',
  'omaha',
  'berkshire bazaar',
];

const MIN_CHUNK_LENGTH = 120;

/** Table-heavy chunks: mostly digits, punctuation, and short tokens. */
const TABLE_LIKE_RATIO_THRESHOLD = 0.45;

export function isNoisyChunk(content: string): boolean {
  const normalized = content.replace(/\s+/g, ' ').trim().toLowerCase();

  if (normalized.length < MIN_CHUNK_LENGTH) {
    return true;
  }

  if (NOISE_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return true;
  }

  if (isTableLikeChunk(normalized)) {
    return true;
  }

  return false;
}

export function filterNoisyChunks(chunks: DocumentChunk[]): {
  kept: DocumentChunk[];
  removed: number;
} {
  const kept: DocumentChunk[] = [];
  let removed = 0;

  for (const chunk of chunks) {
    if (isNoisyChunk(chunk.content)) {
      removed += 1;
      continue;
    }

    kept.push(chunk);
  }

  return { kept, removed };
}

function isTableLikeChunk(normalized: string): boolean {
  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.length < 8) {
    return false;
  }

  const tableLikeTokens = tokens.filter((token) => /^[\d%.,+\-()]+$/.test(token) || token.length <= 2).length;
  return tableLikeTokens / tokens.length >= TABLE_LIKE_RATIO_THRESHOLD;
}
