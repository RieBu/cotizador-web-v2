import { Pool, type QueryResult, type QueryResultRow, type PoolClient } from "pg";

const globalForPg = globalThis as unknown as {
  __jysPool?: Pool;
};

function pool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definida");
  }
  if (!globalForPg.__jysPool) {
    globalForPg.__jysPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: { rejectUnauthorized: false },
    });
  }
  return globalForPg.__jysPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return pool().query<T>(text, params);
}

export async function tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
