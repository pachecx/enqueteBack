import "dotenv/config";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

if (!process.env.DATABASE_URL)
  throw new Error("DATABASE_URL do PostgreSQL do Supabase não configurada.");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function transaction<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export function rows<T extends QueryResultRow>(result: { rows: T[] }): T[] {
  return result.rows;
}
