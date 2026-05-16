import { getDb } from './postgres';
import { EMBEDDING_DIMENSIONS } from '../lib/ollama';

export async function ensureDocumentsSchema(): Promise<void> {
  const db = getDb();

  await db.query('CREATE EXTENSION IF NOT EXISTS vector');
  await dropDocumentsTableWhenEmbeddingDimensionChanged();

  await db.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      content TEXT,
      embedding vector(${EMBEDDING_DIMENSIONS}) NOT NULL,
      metadata JSONB
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS documents_embedding_idx
    ON documents
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100)
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS documents_metadata_idx
    ON documents
    USING gin (metadata)
  `);
}

async function dropDocumentsTableWhenEmbeddingDimensionChanged(): Promise<void> {
  const db = getDb();
  const result = await db.query<{ embedding_type: string }>(`
    SELECT format_type(a.atttypid, a.atttypmod) AS embedding_type
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'documents'
      AND n.nspname = 'public'
      AND a.attname = 'embedding'
      AND NOT a.attisdropped
  `);

  const currentType = result.rows[0]?.embedding_type;
  const expectedType = `vector(${EMBEDDING_DIMENSIONS})`;

  if (currentType && currentType !== expectedType) {
    console.warn(`Dropping documents table because embedding column is ${currentType}; expected ${expectedType}.`);
    await db.query('DROP TABLE documents');
  }
}
