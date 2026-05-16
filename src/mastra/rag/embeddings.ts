import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, getOllamaClient } from '../lib/ollama';

export async function embedText(input: string): Promise<number[]> {
  const response = await getOllamaClient().embed({
    model: EMBEDDING_MODEL,
    input,
  });

  const embedding = response.embeddings[0];
  assertEmbeddingDimensions(embedding);

  return embedding;
}

export async function embedTexts(inputs: string[], batchSize = 64): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (let i = 0; i < inputs.length; i += batchSize) {
    const batch = inputs.slice(i, i + batchSize);
    const response = await getOllamaClient().embed({
      model: EMBEDDING_MODEL,
      input: batch,
    });

    for (const embedding of response.embeddings) {
      assertEmbeddingDimensions(embedding);
      embeddings.push(embedding);
    }
  }

  return embeddings;
}

export function toPgVector(embedding: number[]): string {
  assertEmbeddingDimensions(embedding);
  return `[${embedding.join(',')}]`;
}

function assertEmbeddingDimensions(embedding: number[]): void {
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Unexpected embedding dimension ${embedding.length}; expected ${EMBEDDING_DIMENSIONS} from ${EMBEDDING_MODEL}.`,
    );
  }
}
