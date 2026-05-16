import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { ingestShareholderLetters } from '../rag/ingest';

const ingestionStep = createStep({
  id: 'ingest-shareholder-letters',
  description: 'Parse Berkshire Hathaway shareholder letter PDFs, chunk them, embed chunks, and store them in pgvector.',
  inputSchema: z.object({}),
  outputSchema: z.object({
    pdfCount: z.number(),
    chunkCount: z.number(),
    noisyChunksRemoved: z.number(),
  }),
  execute: async () => ingestShareholderLetters(),
});

export const ingestionWorkflow = createWorkflow({
  id: 'ingestion-workflow',
  inputSchema: z.object({}),
  outputSchema: z.object({
    pdfCount: z.number(),
    chunkCount: z.number(),
    noisyChunksRemoved: z.number(),
  }),
}).then(ingestionStep);

ingestionWorkflow.commit();
