import "dotenv/config";
import { readFile } from "node:fs/promises";
import { pool } from "../src/database.js";

const sql = await readFile(
  new URL("../supabase/migrations/0001_initial.sql", import.meta.url),
  "utf8",
);
const hasPolls = await pool.query("select to_regclass('public.polls') as name");
if (!hasPolls.rows[0].name) await pool.query(sql);

const authSql = await readFile(
  new URL("../supabase/migrations/0002_auth.sql", import.meta.url),
  "utf8",
);
const hasUsers = await pool.query("select to_regclass('public.users') as name");
if (!hasUsers.rows[0].name) await pool.query(authSql);

const usernameColumn = await pool.query(
  "select column_name, is_nullable from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name in ('username', 'email')",
);
const hasUsername = usernameColumn.rows.some(
  (row) => row.column_name === "username",
);
const emailIsNullable = usernameColumn.rows.some(
  (row) => row.column_name === "email" && row.is_nullable === "YES",
);
if (!hasUsername || !emailIsNullable) {
  const usernameSql = await readFile(
    new URL("../supabase/migrations/0003_username.sql", import.meta.url),
    "utf8",
  );
  await pool.query(usernameSql);
}
await pool.end();
console.log("Supabase migration applied.");
