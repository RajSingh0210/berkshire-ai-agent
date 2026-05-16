import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { retrieveRelevantChunks } from '../rag/retrieval';

export const berkshireSearchTool = createTool({
  id: 'search-berkshire-letters',
  description: 'Search Berkshire Hathaway shareholder letters. Provide only a natural-language query.',
  inputSchema: z.object({
    query: z.string().describe('The search query about Berkshire Hathaway or Warren Buffett investment philosophy.'),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        content: z.string(),
        source: z.string(),
        year: z.number(),
        chunkIndex: z.number(),
        score: z.number(),
      }),
    ),
  }),
  execute: async ({ query }) => {
    const chunks = await retrieveRelevantChunks(query);

    return {
      results: chunks.map((chunk) => ({
        content: chunk.content,
        source: chunk.metadata.source,
        year: chunk.metadata.year,
        chunkIndex: chunk.metadata.chunkIndex,
        score: chunk.score,
      })),
    };
  },
});
