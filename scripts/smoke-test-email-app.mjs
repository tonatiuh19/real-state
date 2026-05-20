/**
 * scripts/smoke-test-email-app.mjs
 *
 * Verifies that the Azure App Registration has Mail.Read + Mail.Send
 * Application permissions granted (admin consent), so the permanent
 * app-token email flow can work without any user OAuth/re-authorization.
 *
 * Usage:
 *   node scripts/smoke-test-email-app.mjs
 *
 * Pass a mailbox email as argument to also test reading that specific inbox:
 *   node scripts/smoke-test-email-app.mjs teamdc@encoremortgage.org
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually
const envPath = resolve(__dirname, "../.env");
const env = {};
try {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
} catch {
  console.error("❌ Could not read .env file at", envPath);
  process.exit(1);
}

const tenantId = env.OFFICE365_TENANT_ID;
const clientId = env.OFFICE365_CLIENT_ID;
const clientSecret = env.OFFICE365_CLIENT_SECRET;
const testMailbox = process.argv[2] || null;

if (!tenantId || !clientId || !clientSecret) {
  console.error(
    "❌ Missing OFFICE365_TENANT_ID, OFFICE365_CLIENT_ID, or OFFICE365_CLIENT_SECRET in .env",
  );
  process.exit(1);
}

console.log("─".repeat(60));
console.log("Office 365 App-Token Email Smoke Test");
console.log("─".repeat(60));
console.log("Tenant ID  :", tenantId);
console.log("Client ID  :", clientId);
console.log(
  "Test mailbox:",
  testMailbox || "(not specified — will skip per-user checks)",
);
console.log("─".repeat(60));

// ── Step 1: Acquire app token ─────────────────────────────────────────────────
process.stdout.write("\n[1/4] Acquiring client_credentials token... ");

let accessToken;
try {
  const params = new URLSearchParams();
  params.set("grant_type", "client_credentials");
  params.set("client_id", clientId);
  params.set("client_secret", clientSecret);
  params.set("scope", "https://graph.microsoft.com/.default");

  const resp = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    },
  );
  const json = await resp.json();
  if (!resp.ok) throw new Error(JSON.stringify(json));
  accessToken = json.access_token;
  console.log("✅ Token acquired (expires_in:", json.expires_in, "s)");
} catch (err) {
  console.log("❌ FAILED:", err.message);
  process.exit(1);
}

// ── Step 2: Probe User.Read.All (list users — confirms basic Graph access) ───
process.stdout.write("[2/4] Probing User.Read / user list... ");
try {
  const resp = await fetch(
    "https://graph.microsoft.com/v1.0/users?$select=mail,displayName&$top=3",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const json = await resp.json();
  if (!resp.ok) throw new Error(JSON.stringify(json.error));
  const users = (json.value || [])
    .map((u) => u.mail || u.displayName)
    .filter(Boolean);
  console.log("✅ Listed users:", users.join(", ") || "(none)");
} catch (err) {
  console.log("❌ FAILED:", err.message);
  console.log(
    "   → Make sure User.Read.All Application permission is granted.",
  );
}

// ── Step 3: Probe Mail.Read for a specific mailbox (if provided) ─────────────
if (testMailbox) {
  process.stdout.write(`[3/4] Probing Mail.Read for ${testMailbox}... `);
  try {
    const resp = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(testMailbox)}/mailFolders/Inbox/messages?$top=1&$select=id,subject,receivedDateTime`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const json = await resp.json();
    if (!resp.ok) throw new Error(JSON.stringify(json.error));
    const msgs = json.value || [];
    console.log(
      "✅ Mail.Read confirmed —",
      msgs.length > 0
        ? `latest subject: "${msgs[0].subject}"`
        : "inbox empty or no messages",
    );
  } catch (err) {
    console.log("❌ FAILED:", err.message);
    console.log(
      "   → Add Mail.Read as an APPLICATION permission in Azure Portal",
      "\n     and click 'Grant admin consent for encoremortgage.org'.",
    );
  }
} else {
  console.log("[3/4] Skipped (no mailbox email argument provided)");
}

// ── Step 4: Probe Mail.Send for a specific mailbox ───────────────────────────
// NOTE: Mail.Send (Application) is tested via /sendMail (sends a real email to
// self). Draft creation via POST /messages requires Mail.ReadWrite, not Mail.Send.
if (testMailbox) {
  process.stdout.write(
    `[4/4] Probing Mail.Send for ${testMailbox} (sends test email to self)... `,
  );
  try {
    const resp = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(testMailbox)}/sendMail`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            subject:
              "[smoke-test] App-token Mail.Send confirmed — safe to delete",
            body: {
              contentType: "Text",
              content:
                "This is an automated smoke test to verify Mail.Send Application permission. Safe to delete.",
            },
            toRecipients: [{ emailAddress: { address: testMailbox } }],
          },
          saveToSentItems: false,
        }),
      },
    );
    if (!resp.ok) {
      const json = await resp.json();
      throw new Error(JSON.stringify(json.error));
    }
    console.log("✅ Mail.Send confirmed — test email sent to", testMailbox);
  } catch (err) {
    console.log("❌ FAILED:", err.message);
    console.log(
      "   → Add Mail.Send as an APPLICATION permission in Azure Portal",
      "\n     and click 'Grant admin consent for encoremortgage.org'.",
    );
  }
} else {
  console.log("[4/4] Skipped (no mailbox email argument provided)");
}

console.log("\n" + "─".repeat(60));
console.log(
  "If all checks passed: the permanent app-token email flow is ready.",
);
console.log(
  "The cron at /api/cron/sync-office365-mailboxes will use the app token",
);
console.log("automatically — no user OAuth or re-authorization ever needed.");
console.log("");
console.log("If Mail.Read/Mail.Send checks failed, in Azure Portal:");
console.log("  1. Go to App Registrations → your app → API Permissions");
console.log("  2. Add permission → Microsoft Graph → Application permissions");
console.log("     • Mail.Read");
console.log("     • Mail.Send");
console.log("  3. Click 'Grant admin consent for encoremortgage.org'");
console.log("  4. Re-run this script to confirm");
console.log("─".repeat(60));
