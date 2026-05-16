declare module 'pg' {
  export interface QueryResult<T = Record<string, unknown>> {
    rows: T[];
    rowCount: number | null;
  }

  export interface PoolConfig {
    connectionString?: string;
    ssl?: boolean | { rejectUnauthorized?: boolean };
    max?: number;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    query<T = Record<string, unknown>>(text: string, values?: unknown[]): Promise<QueryResult<T>>;
    end(): Promise<void>;
  }
}
