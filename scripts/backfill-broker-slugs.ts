/**
 * One-time backfill script: generates unique slugs for all brokers that lack one.
 * Run with: npx tsx scripts/backfill-broker-slugs.ts
 */
import "dotenv/config";
import mysql from "mysql2/promise";

function buildSlugBase(firstName: string, lastName: string): string {
  return (firstName + lastName)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // keep only alphanumeric
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT id, first_name, last_name FROM brokers WHERE slug IS NULL ORDER BY id",
    );

    console.log(`\nFound ${rows.length} broker(s) without a slug.\n`);
    if (rows.length === 0) {
      console.log("Nothing to do.");
      return;
    }

    for (const broker of rows) {
      const base =
        buildSlugBase(broker.first_name, broker.last_name) || "broker";
      let candidate = base;
      let suffix = 2;

      // Find a unique candidate
      while (true) {
        const [existing] = await connection.query<mysql.RowDataPacket[]>(
          "SELECT id FROM brokers WHERE slug = ? AND id != ?",
          [candidate, broker.id],
        );
        if ((existing as any[]).length === 0) break;
        candidate = `${base}${suffix++}`;
      }

      await connection.query("UPDATE brokers SET slug = ? WHERE id = ?", [
        candidate,
        broker.id,
      ]);
      console.log(
        `  [${broker.id}] ${broker.first_name} ${broker.last_name} → ${candidate}`,
      );
    }

    console.log("\n✓ Backfill complete.");
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
