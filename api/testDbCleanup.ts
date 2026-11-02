/**
 * Shared cleanup for API integration tests that seed rows into shared TiDB.
 *
 *   afterAll(async () => {
 *     await cleanupIntegrationTestFixtures(pool, { runId: RUN_ID, clientIds, brokerIds });
 *     await pool?.end();
 *   });
 *
 * Ops: npm run test:cleanup-fixtures [-- --dry-run]
 *
 * Safe domains only: @example.test, @smoke.integration.local
 * Always pass `{ runId: RUN_ID }` — never a bare string.
 */
import crypto from "crypto";
import mysql, { type Pool, type ResultSetHeader } from "mysql2/promise";

const TENANT_ID = Number(process.env.MORTGAGE_TENANT_ID ?? "1");

const TEST_EMAIL_SUFFIXES = [
  "@example.test",
  "@smoke.integration.local",
] as const;

/** Unique +1555… E.164 for parallel integration tests. */
export function uniqueTestE164(seed?: string): string {
  const buf = crypto
    .createHash("sha256")
    .update(seed ?? `${process.pid}-${Date.now()}-${Math.random()}`)
    .digest();
  const n = buf.readUInt32BE(0) % 10_000_000;
  return `+1555${String(n).padStart(7, "0")}`;
}

export function createIntegrationTestPool(): Pool {
  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 4000),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: true },
    waitForConnections: true,
    connectionLimit: 2,
    queueLimit: 0,
    timezone: "+00:00",
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
    connectTimeout: 60_000,
  });
}

function isRetriableDbError(err: unknown): boolean {
  const code = String((err as NodeJS.ErrnoException)?.code || "");
  return (
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "PROTOCOL_CONNECTION_LOST" ||
    code === "ECONNREFUSED"
  );
}

export async function withDbRetry<T>(
  fn: () => Promise<T>,
  opts?: { attempts?: number; baseDelayMs?: number },
): Promise<T> {
  const attempts = opts?.attempts ?? 4;
  const baseDelayMs = opts?.baseDelayMs ?? 1500;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetriableDbError(err) || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, baseDelayMs * (i + 1)));
    }
  }
  throw lastErr;
}

export type CleanupRunOpts = {
  runId: string;
  clientIds?: number[];
  brokerIds?: number[];
  loanIds?: number[];
  conversationIds?: string[];
};

export function resolveCleanupRunId(
  opts: string | { runId?: unknown } | null | undefined,
  label: string,
): string {
  if (typeof opts === "string") {
    if (!opts.trim()) {
      throw new Error(
        `[testDbCleanup] ${label}: empty runId string — refusing cleanup`,
      );
    }
    console.warn(
      `[testDbCleanup] ${label}: pass { runId } object instead of bare string`,
    );
    return opts.trim();
  }
  const runId = opts?.runId;
  if (typeof runId !== "string" || !runId.trim()) {
    throw new Error(
      `[testDbCleanup] ${label}: missing runId — refusing cleanup (avoids LIKE '%undefined%')`,
    );
  }
  return runId.trim();
}

function emailLikePatterns(runId: string): string[] {
  return TEST_EMAIL_SUFFIXES.map((sfx) => `%${runId}%${sfx}`);
}

/**
 * Delete clients (and cascade-safe children) created by this RUN_ID.
 */
export async function cleanupIntegrationTestClients(
  pool: Pool,
  opts: CleanupRunOpts,
): Promise<number> {
  const runId = resolveCleanupRunId(opts, "cleanupIntegrationTestClients");
  const ids = new Set<number>(opts.clientIds ?? []);

  for (const like of emailLikePatterns(runId)) {
    const [rows] = await pool.query<{ id: number }[]>(
      `SELECT id FROM clients WHERE tenant_id = ? AND email LIKE ?`,
      [TENANT_ID, like],
    );
    for (const r of rows as unknown as Array<{ id: number }>) {
      ids.add(Number(r.id));
    }
  }

  if (!ids.size) return 0;
  const idList = [...ids];
  const ph = idList.map(() => "?").join(",");

  await pool.query(
    `DELETE FROM task_documents WHERE task_id IN (
       SELECT id FROM tasks WHERE application_id IN (
         SELECT id FROM loan_applications WHERE client_user_id IN (${ph})
       )
     )`,
    idList,
  ).catch(() => undefined);
  await pool.query(
    `DELETE FROM tasks WHERE application_id IN (
       SELECT id FROM loan_applications WHERE client_user_id IN (${ph})
     )`,
    idList,
  ).catch(() => undefined);
  await pool.query(
    `DELETE FROM loan_applications WHERE client_user_id IN (${ph})`,
    idList,
  ).catch(() => undefined);
  await pool.query(
    `UPDATE conversation_threads SET client_id = NULL
     WHERE client_id IN (${ph})`,
    idList,
  ).catch(() => undefined);
  await pool.query(
    `DELETE FROM clients WHERE id IN (${ph}) AND tenant_id = ?`,
    [...idList, TENANT_ID],
  );

  return idList.length;
}

/**
 * Delete synthetic brokers (partner realtors / ephemeral MBs) for this RUN_ID.
 * Never deletes non-test emails.
 */
export async function cleanupIntegrationTestBrokers(
  pool: Pool,
  opts: CleanupRunOpts,
): Promise<number> {
  const runId = resolveCleanupRunId(opts, "cleanupIntegrationTestBrokers");
  const ids = new Set<number>(opts.brokerIds ?? []);

  for (const like of emailLikePatterns(runId)) {
    const [rows] = await pool.query<{ id: number }[]>(
      `SELECT id FROM brokers WHERE tenant_id = ? AND email LIKE ?`,
      [TENANT_ID, like],
    );
    for (const r of rows as unknown as Array<{ id: number }>) {
      ids.add(Number(r.id));
    }
  }

  if (!ids.size) return 0;
  const idList = [...ids];
  const ph = idList.map(() => "?").join(",");

  await pool.query(
    `DELETE FROM broker_sessions WHERE broker_id IN (${ph})`,
    idList,
  ).catch(() => undefined);
  await pool.query(
    `DELETE FROM brokers WHERE id IN (${ph}) AND tenant_id = ?`,
    [...idList, TENANT_ID],
  );

  return idList.length;
}

export async function cleanupIntegrationTestConversations(
  pool: Pool,
  opts: CleanupRunOpts,
): Promise<void> {
  const runId = resolveCleanupRunId(
    opts,
    "cleanupIntegrationTestConversations",
  );
  const ids = opts.conversationIds ?? [];
  if (ids.length) {
    const ph = ids.map(() => "?").join(",");
    await pool.query(
      `DELETE FROM communications WHERE conversation_id IN (${ph})`,
      ids,
    ).catch(() => undefined);
    await pool.query(
      `DELETE FROM conversation_threads WHERE conversation_id IN (${ph})`,
      ids,
    ).catch(() => undefined);
  }
  await pool.query(
    `DELETE FROM conversation_threads
     WHERE tenant_id = ? AND conversation_id LIKE ?`,
    [TENANT_ID, `%${runId}%`],
  ).catch(() => undefined);
}

/** Full fixture wipe for a suite RUN_ID. */
export async function cleanupIntegrationTestFixtures(
  pool: Pool,
  opts: CleanupRunOpts,
): Promise<void> {
  resolveCleanupRunId(opts, "cleanupIntegrationTestFixtures");
  await cleanupIntegrationTestConversations(pool, opts);
  await cleanupIntegrationTestClients(pool, opts);
  await cleanupIntegrationTestBrokers(pool, opts);
}

/** Ops purge: all leftover @example.test / @smoke.integration.local clients+brokers. */
export async function purgeAllIntegrationTestOrphans(
  pool: Pool,
  opts?: { dryRun?: boolean },
): Promise<{ clients: number; brokers: number }> {
  const dryRun = Boolean(opts?.dryRun);
  let clients = 0;
  let brokers = 0;
  for (const sfx of TEST_EMAIL_SUFFIXES) {
    const [cRows] = await pool.query<ResultSetHeader[]>(
      dryRun
        ? `SELECT COUNT(*) AS cnt FROM clients WHERE email LIKE ?`
        : `DELETE FROM clients WHERE email LIKE ?`,
      [`%${sfx}`],
    );
    if (dryRun) {
      clients += Number((cRows as unknown as Array<{ cnt: number }>)[0]?.cnt ?? 0);
    } else {
      clients += Number((cRows as unknown as ResultSetHeader).affectedRows ?? 0);
    }

    const [bRows] = await pool.query<ResultSetHeader[]>(
      dryRun
        ? `SELECT COUNT(*) AS cnt FROM brokers WHERE email LIKE ?`
        : `DELETE FROM brokers WHERE email LIKE ? AND role IN ('broker','admin')`,
      [`%${sfx}`],
    );
    if (dryRun) {
      brokers += Number((bRows as unknown as Array<{ cnt: number }>)[0]?.cnt ?? 0);
    } else {
      brokers += Number((bRows as unknown as ResultSetHeader).affectedRows ?? 0);
    }
  }
  return { clients, brokers };
}
