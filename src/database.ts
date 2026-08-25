import "dotenv/config";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

const connectionString = process.env.ENQUETE_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "ENQUETE_DATABASE_URL do PostgreSQL do Supabase não configurada.",
  );
}

export const pool = new Pool({
  connectionString,
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
