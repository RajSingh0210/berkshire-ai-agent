import { getDb } from '../db/postgres';
import { ensureDocumentsSchema } from '../db/schema';
import { toPgVector } from './embeddings';
import type { DocumentChunk } from './types';

export async function replaceDocumentChunks(
  chunks: DocumentChunk[],
  embeddings: number[][],
): Promise<number> {
  if (chunks.length !== embeddings.length) {
    throw new Error(`Chunk count (${chunks.length}) does not match embedding count (${embeddings.length})`);
  }

  await ensureDocumentsSchema();
  const db = getDb();
  await db.query('TRUNCATE documents RESTART IDENTITY');
  console.info('Cleared existing documents table.');

  let inserted = 0;
  for (let i = 0; i < chunks.length; i += 1) {
    await db.query(
      `
        INSERT INTO documents (content, embedding, metadata)
        VALUES ($1, $2::vector, $3::jsonb)
      `,
      [chunks[i].content, toPgVector(embeddings[i]), JSON.stringify(chunks[i].metadata)],
    );
    inserted += 1;
  }

  return inserted;
}

export async function countDocumentRows(): Promise<number> {
  const result = await getDb().query<{ count: string }>('SELECT COUNT(*)::text AS count FROM documents');
  return Number(result.rows[0]?.count ?? 0);
}
