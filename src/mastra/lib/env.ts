import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, '../../../.env');

dotenv.config({ path: rootEnvPath });

function readRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getDatabaseUrl(): string {
  return readRequiredEnv('DATABASE_URL');
}

export function getNodeEnv(): string {
  return process.env.NODE_ENV ?? 'development';
}

export function getOllamaHost(): string {
  return process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434';
}

/** Chat and embeddings use Ollama only — no cloud model providers. */
export function getOllamaChatModel(): string {
  return process.env.OLLAMA_CHAT_MODEL ?? 'llama3.1:8b';
}

export function getOllamaEmbeddingModel(): string {
  return process.env.OLLAMA_EMBEDDING_MODEL ?? 'nomic-embed-text';
}

export function getOllamaEmbeddingDimensions(): number {
  const value = process.env.OLLAMA_EMBEDDING_DIMENSIONS ?? '768';
  const dimensions = Number.parseInt(value, 10);

  if (!Number.isInteger(dimensions) || dimensions <= 0) {
    throw new Error(`OLLAMA_EMBEDDING_DIMENSIONS must be a positive integer; received "${value}".`);
  }

  return dimensions;
}
