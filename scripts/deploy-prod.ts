import "dotenv/config";

import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
import process from "node:process";
import mysql from "mysql2/promise";
import { checkApiIndexInline } from "./check-api-inline";

const DEFAULT_TENANT_ID = Number(process.env.DEPLOY_SETTINGS_TENANT_ID ?? "1");

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizeVersion(value: string): string {
  return value.trim();
}

function dbConfig() {
  return {
    host: requireEnv("DB_HOST"),
    port: Number(requireEnv("DB_PORT")),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_NAME"),
    ssl:
      process.env.DB_SSL === "false"
        ? undefined
        : { minVersion: "TLSv1.2" as const },
    // TiDB Serverless drops idle sockets; never hold a conn across vercel --prod.
    enableKeepAlive: true,
    connectTimeout: 20_000,
  };
}

async function withDb<T>(fn: (conn: mysql.Connection) => Promise<T>): Promise<T> {
  const conn = await mysql.createConnection(dbConfig());
  try {
    return await fn(conn);
  } finally {
    await conn.end().catch(() => undefined);
  }
}

async function runCommand(command: string, args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      env: process.env,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `${command} ${args.join(" ")} failed with exit code ${code ?? "unknown"}`,
        ),
      );
    });
  });
}

/**
 * Vercel inline monolith gate + typecheck + full validate:all.
 * Relative runtime imports from api/index.ts → ERR_MODULE_NOT_FOUND on Vercel.
 */
async function runPreDeployChecks() {
  console.log("\n🧪 Pre-deploy checks: api inline + validate:all...\n");

  const inline = checkApiIndexInline();
  console.log(inline.report);
  if (!inline.ok) {
    throw new Error(
      "api/index.ts has relative runtime imports — inline the logic before deploying to Vercel.",
    );
  }

  // validate:all includes typecheck, unit tests, domain smokes, and build
  await runCommand("npm", ["run", "validate:all"]);
  console.log("\n✅ validate:all passed. Continuing to deploy...\n");
}

async function promptForVersion(
  currentVersion: string | null,
): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const currentLabel = currentVersion?.trim() || "not set";
    console.log(`\n🏷️  Current production version: ${currentLabel}`);

    while (true) {
      const input = await rl.question("✏️  Enter deploy version: ");
      const version = normalizeVersion(input);
      if (!version) {
        console.log("❌ Version cannot be empty.");
        continue;
      }

      const confirm = await rl.question(
        `❓ Deploy version ${version} to production and update app_version after success? (y/N): `,
      );
      if (confirm.trim().toLowerCase() === "y") {
        console.log(`✅ Confirmed. Proceeding with version ${version}...`);
        return version;
      } else {
        console.log(
          "❌ Deploy cancelled. Please enter a new version or Ctrl+C to abort.",
        );
      }
    }
  } finally {
    rl.close();
  }
}

async function readAppVersion(): Promise<string | null> {
  return withDb(async (conn) => {
    const [rows] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT setting_value
         FROM system_settings
        WHERE setting_key = 'app_version'
          AND (tenant_id = ? OR tenant_id IS NULL)
        ORDER BY tenant_id DESC
        LIMIT 1`,
      [DEFAULT_TENANT_ID],
    );
    return (rows as mysql.RowDataPacket[])[0]?.setting_value ?? null;
  });
}

async function writeAppVersion(deployVersion: string): Promise<void> {
  await withDb(async (conn) => {
    await conn.execute(
      `INSERT INTO system_settings (
         tenant_id,
         setting_key,
         setting_value,
         setting_type,
         description,
         updated_at
       ) VALUES (?, 'app_version', ?, 'string', ?, NOW())
       ON DUPLICATE KEY UPDATE
         setting_value = VALUES(setting_value),
         setting_type = VALUES(setting_type),
         description = VALUES(description),
         updated_at = NOW()`,
      [
        DEFAULT_TENANT_ID,
        deployVersion,
        "Current deployed application version shown in the admin settings page header.",
      ],
    );
  });
}

async function main() {
  // Validate DB env early (before long typecheck/validate).
  dbConfig();

  const cliArgs = process.argv.slice(2);
  const skipChecks =
    cliArgs.includes("--skip-checks") ||
    process.env.SKIP_DEPLOY_CHECKS === "1" ||
    process.env.SKIP_DEPLOY_CHECKS === "true";
  const filteredArgs = cliArgs.filter((arg) => arg !== "--skip-checks");
  const explicitVersion =
    filteredArgs.find((arg) => !arg.startsWith("-")) ?? "";
  const vercelArgs = explicitVersion
    ? filteredArgs.filter(
        (arg, index) => index !== filteredArgs.indexOf(explicitVersion),
      )
    : filteredArgs;

  if (!skipChecks) {
    await runPreDeployChecks();
  } else {
    console.log(
      "\n⚠️  Skipping pre-deploy checks (--skip-checks / SKIP_DEPLOY_CHECKS).\n",
    );
  }

  // Short-lived connection — do not hold open across vercel --prod
  // (TiDB Serverless closes idle sockets → "connection is in closed state").
  const currentVersion = await readAppVersion();
  const deployVersion = explicitVersion
    ? normalizeVersion(explicitVersion)
    : await promptForVersion(currentVersion);

  if (!deployVersion) {
    throw new Error("Deploy version cannot be empty.");
  }

  console.log(
    `\n🚀 Starting Vercel production deploy for version ${deployVersion}...\n`,
  );

  // Domain gate kept in addition to optimum-style validate:all
  // (also included inside validate:all — run once more only if skipped checks).
  if (skipChecks) {
    console.log("🔍 Running Application Received production preflight...\n");
    await runCommand("npm", ["run", "preflight:application-received"]);
  }

  await runCommand("npx", ["vercel", "--prod", ...vercelArgs]);

  await writeAppVersion(deployVersion);

  console.log(
    `\n🎉 Production deploy succeeded! app_version updated to ${deployVersion}.`,
  );
}

main().catch((error) => {
  console.error(
    `\n❌ Deploy aborted: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
});
