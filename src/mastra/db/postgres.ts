import { Pool } from 'pg';
import { getDatabaseUrl, getNodeEnv } from '../lib/env';

const globalForPg = globalThis as unknown as {
  berkshirePool?: Pool;
};

function createPool(): Pool {
  const connectionString = getDatabaseUrl();

  return new Pool({
    connectionString,
    max: 5,
    ssl:
      getNodeEnv() === 'production' || connectionString.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : undefined,
  });
}

export function getDb(): Pool {
  globalForPg.berkshirePool ??= createPool();

  return globalForPg.berkshirePool;
}

export async function closeDb(): Promise<void> {
  if (globalForPg.berkshirePool) {
    await globalForPg.berkshirePool.end();
    globalForPg.berkshirePool = undefined;
  }
}
