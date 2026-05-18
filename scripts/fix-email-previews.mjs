/**
 * One-time script: strips HTML from last_message_preview for email threads.
 * Safe to re-run — only touches rows where preview looks like HTML.
 */
import { readFileSync } from "fs";
import mysql from "mysql2/promise";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

function stripHtml(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/<[^>]*$/, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z]{2,6};/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

const pool = await mysql.createPool({
  host: env.DB_HOST,
  port: Number(env.DB_PORT),
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: { rejectUnauthorized: false },
});

const [rows] = await pool.query(
  `SELECT id, last_message_preview FROM conversation_threads
   WHERE tenant_id = 1
     AND last_message_type = 'email'
     AND last_message_preview REGEXP '<[a-zA-Z/!]'`,
);

console.log(`Found ${rows.length} threads with HTML previews to clean`);

let fixed = 0;
for (const row of rows) {
  const clean = stripHtml(row.last_message_preview);
  if (clean !== row.last_message_preview) {
    await pool.query(
      `UPDATE conversation_threads SET last_message_preview = ? WHERE id = ?`,
      [clean, row.id],
    );
    fixed++;
  }
}

console.log(`✅ Cleaned ${fixed} previews`);
await pool.end();
