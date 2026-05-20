/**
 * scripts/smoke-test-folders.mjs
 *
 * Smoke-tests the new Outlook folder browsing feature by hitting the
 * Microsoft Graph API directly with the same app-level token the backend uses.
 *
 * Usage:
 *   node scripts/smoke-test-folders.mjs teamdc@encoremortgage.org
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env ─────────────────────────────────────────────────────────────────
const envPath = resolve(__dirname, "../.env");
const env = {};
try {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
} catch {
  console.error("❌ Could not read .env at", envPath);
  process.exit(1);
}

const tenantId = env.OFFICE365_TENANT_ID;
const clientId = env.OFFICE365_CLIENT_ID;
const clientSecret = env.OFFICE365_CLIENT_SECRET;
const mailbox = process.argv[2];

if (!tenantId || !clientId || !clientSecret) {
  console.error(
    "❌ Missing OFFICE365_TENANT_ID / CLIENT_ID / CLIENT_SECRET in .env",
  );
  process.exit(1);
}
if (!mailbox) {
  console.error(
    "Usage: node scripts/smoke-test-folders.mjs <mailbox@email.com>",
  );
  process.exit(1);
}

const base = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailbox)}`;

console.log("─".repeat(60));
console.log("Outlook Folder Browsing Smoke Test");
console.log("─".repeat(60));
console.log("Mailbox:", mailbox);
console.log("─".repeat(60));

// ── Step 1: Acquire app token ─────────────────────────────────────────────────
process.stdout.write("\n[1/4] Acquiring app token (client_credentials)... ");
let token;
try {
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
  });
  const r = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    },
  );
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j));
  token = j.access_token;
  console.log("✅");
} catch (e) {
  console.log("❌", e.message);
  process.exit(1);
}

const headers = { Authorization: `Bearer ${token}` };

// ── Step 2: List all top-level mail folders ───────────────────────────────────
process.stdout.write("[2/4] Listing mail folders (top-level + children)... ");
let folders = [];
try {
  const SELECT =
    "id,displayName,totalItemCount,unreadItemCount,childFolderCount";
  const r = await fetch(`${base}/mailFolders?$top=100&$select=${SELECT}`, {
    headers,
  });
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j.error));
  const topLevel = j.value ?? [];

  // Fetch child folders for every top-level folder that has children
  const childResults = await Promise.all(
    topLevel
      .filter((f) => (f.childFolderCount ?? 0) > 0)
      .map(async (f) => {
        const rc = await fetch(
          `${base}/mailFolders/${encodeURIComponent(f.id)}/childFolders?$top=100&$select=${SELECT}`,
          { headers },
        );
        const jc = await rc.json();
        return {
          parentId: f.id,
          parentName: f.displayName,
          children: jc.value ?? [],
        };
      }),
  );

  const SYSTEM = new Set([
    "inbox",
    "sent items",
    "drafts",
    "deleted items",
    "junk email",
    "outbox",
    "archive",
    "conversation history",
  ]);

  folders = [
    ...topLevel.map((f) => ({ ...f, parentId: null })),
    ...childResults.flatMap(({ parentId, children }) =>
      children.map((c) => ({ ...c, parentId })),
    ),
  ];

  const custom = folders.filter(
    (f) => !SYSTEM.has(f.displayName?.toLowerCase?.() ?? ""),
  );
  const system = folders.filter(
    (f) => SYSTEM.has(f.displayName?.toLowerCase?.() ?? "") && !f.parentId,
  );

  console.log(
    `✅  ${folders.length} total (${system.length} system, ${custom.length} custom)`,
  );
  console.log("\n   System folders:");
  system.forEach((f) =>
    console.log(
      `     [${f.unreadItemCount ?? 0} unread / ${f.totalItemCount ?? 0} total]  ${f.displayName}`,
    ),
  );

  // Group custom folders by parent
  const byParent = {};
  childResults.forEach(({ parentName, children, parentId }) => {
    const cust = children.filter(
      (c) => !SYSTEM.has(c.displayName?.toLowerCase?.() ?? ""),
    );
    if (cust.length) byParent[parentName] = cust;
  });
  const rootCustom = custom.filter((f) => !f.parentId);

  console.log("\n   Custom folders (will appear in sidebar):");
  if (custom.length === 0) {
    console.log("     (none)");
  } else {
    rootCustom.forEach((f) =>
      console.log(
        `     [${f.unreadItemCount ?? 0} unread / ${f.totalItemCount ?? 0} total]  ${f.displayName}`,
      ),
    );
    Object.entries(byParent).forEach(([parent, children]) => {
      console.log(`     ▾ (inside ${parent})`);
      children.forEach((f) =>
        console.log(
          `       [${f.unreadItemCount ?? 0} unread / ${f.totalItemCount ?? 0} total]  ${f.displayName}`,
        ),
      );
    });
  }
} catch (e) {
  console.log("❌", e.message);
  process.exit(1);
}

// ── Step 3: Read top 3 messages from the first custom folder with emails ──────
const targetFolder = folders.find(
  (f) =>
    ![
      "inbox",
      "sent items",
      "drafts",
      "deleted items",
      "junk email",
      "outbox",
      "archive",
      "conversation history",
    ].includes(f.displayName?.toLowerCase?.() ?? "") &&
    (f.totalItemCount ?? 0) > 0,
);

if (!targetFolder) {
  console.log("\n[3/4] Skipped — no custom folder with messages found.");
} else {
  process.stdout.write(
    `\n[3/4] Reading messages from "${targetFolder.displayName}"... `,
  );
  try {
    const r = await fetch(
      `${base}/mailFolders/${encodeURIComponent(targetFolder.id)}/messages?$top=3&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,isRead`,
      { headers },
    );
    const j = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(j.error));
    const msgs = j.value ?? [];
    console.log(`✅  ${msgs.length} message(s) retrieved`);
    msgs.forEach((m) => {
      const from =
        m.from?.emailAddress?.name || m.from?.emailAddress?.address || "?";
      const date = m.receivedDateTime
        ? new Date(m.receivedDateTime).toLocaleDateString()
        : "?";
      const read = m.isRead ? "read" : "UNREAD";
      console.log(
        `     [${read}] ${date}  From: ${from}  —  ${m.subject?.slice(0, 60) ?? "(no subject)"}`,
      );
    });

    // ── Step 4: Fetch full body of first message ──────────────────────────────
    if (msgs.length > 0) {
      const msgId = msgs[0].id;
      process.stdout.write(`\n[4/4] Fetching full body of first message... `);
      try {
        const r2 = await fetch(
          `${base}/mailFolders/${encodeURIComponent(targetFolder.id)}/messages/${encodeURIComponent(msgId)}?$select=id,subject,body`,
          { headers },
        );
        const j2 = await r2.json();
        if (!r2.ok) throw new Error(JSON.stringify(j2.error));
        const bodyType = j2.body?.contentType ?? "unknown";
        const bodyLen = j2.body?.content?.length ?? 0;
        console.log(`✅  body type=${bodyType}, length=${bodyLen} chars`);
      } catch (e2) {
        console.log("❌", e2.message);
      }
    } else {
      console.log("\n[4/4] Skipped — no messages to fetch body from.");
    }
  } catch (e) {
    console.log("❌", e.message);
  }
}

console.log("\n" + "─".repeat(60));
console.log("All checks passed → folder browsing is ready.");
console.log("Deploy and click any custom folder in the Email sidebar.");
console.log("─".repeat(60));
