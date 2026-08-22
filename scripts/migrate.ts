import "dotenv/config";
import { readFile } from "node:fs/promises";
import { pool } from "../src/database.js";

const sql = await readFile(
  new URL("../supabase/migrations/0001_initial.sql", import.meta.url),
  "utf8",
);
await pool.query(sql);
await pool.end();
console.log("Supabase migration applied.");
