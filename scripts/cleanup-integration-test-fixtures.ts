/**
 * Ops purge for leftover integration-test fixtures.
 * Usage:
 *   npm run test:cleanup-fixtures
 *   npm run test:cleanup-fixtures -- --dry-run
 */
import "dotenv/config";
import {
  createIntegrationTestPool,
  purgeAllIntegrationTestOrphans,
} from "../api/testDbCleanup";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const pool = createIntegrationTestPool();
  try {
    const result = await purgeAllIntegrationTestOrphans(pool, { dryRun });
    console.log(
      dryRun
        ? `[dry-run] would purge clients=${result.clients} brokers=${result.brokers}`
        : `purged clients=${result.clients} brokers=${result.brokers}`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
