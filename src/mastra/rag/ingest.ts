import { closeDb } from '../db/postgres';
import { chunkPdfs } from './chunk';
import { embedTexts } from './embeddings';
import { parseAllPdfs } from './pdf-parser';
import { replaceDocumentChunks } from './store';

export async function ingestShareholderLetters(): Promise<void> {
  console.info('Parsing PDFs...');
  const pdfs = await parseAllPdfs();
  console.info(`Parsed ${pdfs.length} PDF(s).`);

  console.info('Chunking text...');
  const chunks = chunkPdfs(pdfs);
  console.info(`Created ${chunks.length} chunk(s).`);

  console.info('Generating embeddings...');
  const embeddings = await embedTexts(chunks.map((c) => c.content));
  console.info(`Generated ${embeddings.length} embedding(s).`);

  console.info('Storing chunks...');
  const inserted = await replaceDocumentChunks(chunks, embeddings);
  console.info(`Inserted ${inserted} document chunk(s) into the database.`);
}

import { fileURLToPath } from 'node:url';

async function main(): Promise<void> {
  await ingestShareholderLetters();
}

if (import.meta.url.startsWith('file:') && process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .catch((error) => {
      console.error('Ingestion failed.');
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await closeDb();
    });
}
