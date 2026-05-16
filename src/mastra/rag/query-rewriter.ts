import { CHAT_MODEL, getOllamaClient } from '../lib/ollama';

const REWRITE_TIMEOUT_MS = 12_000;

/**
 * Expands a user question into a retrieval-friendly query for shareholder letter search.
 * Falls back to the original question if rewriting fails.
 */
export async function rewriteQueryForRetrieval(question: string): Promise<string> {
  const trimmed = question.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }

  try {
    const response = await Promise.race([
      getOllamaClient().chat({
        model: CHAT_MODEL,
        stream: false,
        messages: [
          {
            role: 'system',
            content:
              'You rewrite user questions for semantic search over Warren Buffett Berkshire Hathaway annual shareholder letters. Output only the rewritten query as plain text — no quotes, no explanation.',
          },
          {
            role: 'user',
            content: `
Rewrite this question for optimal retrieval from Berkshire Hathaway shareholder letters.

Expand concepts semantically while preserving the user's intent. Include relevant synonyms and related investing terms (value investing, capital allocation, moats, insurance float, long-term ownership, etc.) only when they fit the question.

Keep it to 2–4 short phrases separated by commas. Do not answer the question.

Original question:
${trimmed}

Rewritten retrieval query:
`.trim(),
          },
        ],
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Query rewrite timed out')), REWRITE_TIMEOUT_MS);
      }),
    ]);

    const rewritten = response.message.content?.trim();
    if (!rewritten || rewritten.length < 8) {
      return trimmed;
    }

    return rewritten.replace(/\n+/g, ' ').trim();
  } catch {
    return trimmed;
  }
}
