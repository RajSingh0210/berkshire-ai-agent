import { Ollama } from 'ollama';
import { getOllamaChatModel, getOllamaEmbeddingDimensions, getOllamaEmbeddingModel, getOllamaHost } from './env';

/** Local Ollama chat model (OpenAI-compatible /v1 endpoint). */
export const CHAT_MODEL = getOllamaChatModel();

/** Local Ollama embedding model for pgvector retrieval. */
export const EMBEDDING_MODEL = getOllamaEmbeddingModel();

/** Must match the active embedding model output size (nomic-embed-text = 768). */
export const EMBEDDING_DIMENSIONS = getOllamaEmbeddingDimensions();

let client: Ollama | undefined;

export function getOllamaClient(): Ollama {
  client ??= new Ollama({
    host: getOllamaHost(),
  });

  return client;
}

export function getOllamaChatUrl(): string {
  return `${getOllamaHost().replace(/\/$/, '')}/v1`;
}
