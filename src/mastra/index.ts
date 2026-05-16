
import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';
import { berkshireAgent } from './agents/berkshire-agent';
import { ingestionWorkflow } from './workflows/ingestion-workflow';

export const mastra = new Mastra({
  workflows: { ingestionWorkflow },
  agents: { berkshireAgent },
  storage: new LibSQLStore({
    id: 'mastra-storage',
    url: 'file:./mastra.db',
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
