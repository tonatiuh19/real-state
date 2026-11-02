/**
 * Generate Encore MCP pricing PDF — F&F quote with expanded pricing detail.
 * Run: node docs/generate-encore-mcp-pricing-pdf.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const NAVY = rgb(0.102, 0.227, 0.361);
const INK = rgb(0.102, 0.137, 0.196);
const MUTED = rgb(0.45, 0.51, 0.58);
const LIGHT = rgb(0.94, 0.96, 0.98);
const WHITE = rgb(1, 1, 1);
const LINE = rgb(0.82, 0.84, 0.88);
const ACCENT = rgb(0.17, 0.42, 0.69);
const SOFT = rgb(0.9, 0.93, 0.97);

function drawHeader(page, logo, logoW, logoH, helv, helvBold, pageLabel) {
  page.drawImage(logo, { x: 48, y: 730, width: logoW, height: logoH });
  page.drawText("ENCORE MORTGAGE", {
    x: 400,
    y: 758,
    size: 9,
    font: helvBold,
    color: NAVY,
  });
  page.drawText("AI Ops (MCP) · Quotation", {
    x: 400,
    y: 744,
    size: 10,
    font: helv,
    color: MUTED,
  });
  page.drawText("Family & Friends pricing", {
    x: 400,
    y: 730,
    size: 9,
    font: helvBold,
    color: ACCENT,
  });
  page.drawRectangle({ x: 48, y: 716, width: 516, height: 2.5, color: NAVY });
  page.drawText(pageLabel, {
    x: 48,
    y: 702,
    size: 8,
    font: helv,
    color: MUTED,
  });
}

function drawFooter(page, helv, helvBold, pageNum, pageCount) {
  page.drawRectangle({ x: 48, y: 52, width: 516, height: 1, color: LINE });
  page.drawText(
    "Encore Mortgage  ·  Confidential — Family & Friends quotation",
    { x: 48, y: 36, size: 8, font: helvBold, color: NAVY },
  );
  page.drawText(
    `Questions: alex@go-mez.com or cesar@go-mez.com  ·  Valid as of September 2026  ·  ${pageNum}/${pageCount}`,
    { x: 48, y: 24, size: 8, font: helv, color: MUTED },
  );
}

function sectionTitle(page, text, x, y, helvBold) {
  page.drawText(text, { x, y, size: 10, font: helvBold, color: NAVY });
}

function bullet(page, text, x, y, helv) {
  page.drawCircle({ x: x + 3, y: y + 2.5, size: 2, color: NAVY });
  page.drawText(text, { x: x + 12, y, size: 9, font: helv, color: INK });
}

async function main() {
  const pdf = await PDFDocument.create();
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdf.embedPng(
    readFileSync(join(__dirname, "encore-logo.png")),
  );
  const logoH = 42;
  const logoW = (logo.width / logo.height) * logoH;

  // ─── PAGE 1 ─────────────────────────────────────────────────────────────
  const p1 = pdf.addPage([612, 792]);
  drawHeader(p1, logo, logoW, logoH, helv, helvBold, "Page 1 · Overview");

  p1.drawText("Platform Owner AI Ops", {
    x: 48,
    y: 678,
    size: 22,
    font: helvBold,
    color: NAVY,
  });
  p1.drawText(
    "Connect Claude or Cursor to your Encore CRM — pipeline, clients, SMS, tasks,",
    { x: 48, y: 656, size: 10, font: helv, color: INK },
  );
  p1.drawText(
    "and more — with OAuth, audit logs, and confirm-gated writes. For platform owner seats only.",
    { x: 48, y: 642, size: 10, font: helv, color: INK },
  );

  p1.drawRectangle({ x: 48, y: 602, width: 516, height: 28, color: LIGHT });
  p1.drawRectangle({ x: 48, y: 602, width: 4, height: 28, color: ACCENT });
  p1.drawText(
    "Family & Friends quotation — preferential pricing, not publicly listed rates.",
    { x: 60, y: 612, size: 10, font: helvBold, color: NAVY },
  );

  sectionTitle(p1, "WHY AI OPS", 48, 576, helvBold);
  [
    [
      "Run the CRM from Claude or Cursor",
      "Search clients, update pipeline, send SMS, create tasks — without living in the admin UI.",
    ],
    [
      "Secure by design",
      "OAuth connection, audit log on every tool call, and confirm-gated writes before anything changes.",
    ],
    [
      "Built for power-user owners",
      "Sized for real platform-owner load (search, messaging, tasks) — not a demo chatbot.",
    ],
    [
      "Your meters stay separate",
      "SMS, email, and Mortgi still bill through existing Encore usage packs. This quote is MCP access only.",
    ],
  ].forEach(([title, body], i) => {
    const y = 550 - i * 40;
    p1.drawCircle({ x: 56, y: y + 4, size: 3.5, color: NAVY });
    p1.drawText(title, { x: 68, y, size: 11, font: helvBold, color: INK });
    p1.drawText(body, { x: 68, y: y - 14, size: 9, font: helv, color: MUTED });
  });

  sectionTitle(p1, "YOUR PACKAGE", 48, 372, helvBold);
  const cx = 48;
  const cy = 230;
  p1.drawRectangle({
    x: cx,
    y: cy,
    width: 516,
    height: 128,
    color: LIGHT,
    borderColor: NAVY,
    borderWidth: 2,
  });
  p1.drawRectangle({
    x: cx + 16,
    y: cy + 110,
    width: 88,
    height: 14,
    color: NAVY,
  });
  p1.drawText("OPS MCP", {
    x: cx + 28,
    y: cy + 114,
    size: 8,
    font: helvBold,
    color: WHITE,
  });
  p1.drawText("Platform Owner AI Ops Seat", {
    x: cx + 16,
    y: cy + 88,
    size: 14,
    font: helvBold,
    color: NAVY,
  });
  p1.drawText("SETUP (ONE-TIME)", {
    x: cx + 16,
    y: cy + 66,
    size: 8,
    font: helv,
    color: MUTED,
  });
  p1.drawText("$5,000", {
    x: cx + 16,
    y: cy + 42,
    size: 26,
    font: helvBold,
    color: INK,
  });
  p1.drawText("MONTHLY SEAT", {
    x: cx + 220,
    y: cy + 66,
    size: 8,
    font: helv,
    color: MUTED,
  });
  p1.drawText("$300", {
    x: cx + 220,
    y: cy + 42,
    size: 26,
    font: helvBold,
    color: INK,
  });
  p1.drawText("/ mo", {
    x: cx + 300,
    y: cy + 50,
    size: 12,
    font: helv,
    color: MUTED,
  });
  p1.drawText(
    "See page 2 for what each fee covers and year-1 examples.",
    { x: cx + 16, y: cy + 16, size: 9, font: helv, color: MUTED },
  );

  sectionTitle(p1, "CASH SUMMARY (THIS QUOTE)", 48, 208, helvBold);
  [
    ["$5,000", "One-time setup"],
    ["$300", "Per month / seat"],
    ["$5,300", "Month 1 total"],
    ["$300", "Steady-state / mo"],
  ].forEach(([n, l], i) => {
    const x = 48 + i * 132;
    p1.drawRectangle({ x, y: 148, width: 124, height: 48, color: NAVY });
    p1.drawText(n, {
      x: x + 12,
      y: 174,
      size: 16,
      font: helvBold,
      color: WHITE,
    });
    p1.drawText(l.toUpperCase(), {
      x: x + 12,
      y: 158,
      size: 7,
      font: helv,
      color: rgb(0.85, 0.9, 0.95),
    });
  });

  p1.drawText(
    "Add-on only — stacks beside your existing Encore platform plan (platform fee billed separately).",
    { x: 48, y: 126, size: 8.5, font: helv, color: MUTED },
  );
  p1.drawText(
    "Not in this quote: Encore platform subscription · SMS / email / Mortgi meters · Claude/Cursor model usage.",
    { x: 48, y: 112, size: 8.5, font: helv, color: MUTED },
  );

  drawFooter(p1, helv, helvBold, 1, 2);

  // ─── PAGE 2 ─────────────────────────────────────────────────────────────
  const p2 = pdf.addPage([612, 792]);
  drawHeader(
    p2,
    logo,
    logoW,
    logoH,
    helv,
    helvBold,
    "Page 2 · How pricing works",
  );

  p2.drawText("How the pricing works", {
    x: 48,
    y: 678,
    size: 18,
    font: helvBold,
    color: NAVY,
  });
  p2.drawText(
    "Two charges for AI Ops (MCP). Everything else stays on your current Encore meters.",
    { x: 48, y: 658, size: 10, font: helv, color: MUTED },
  );

  // 1. Setup
  sectionTitle(p2, "1. ONE-TIME SETUP — $5,000", 48, 630, helvBold);
  p2.drawText(
    "50% ($2,500) due to start build + onboarding. Balance due when MCP is enabled.",
    { x: 48, y: 612, size: 9, font: helv, color: INK },
  );
  p2.drawText("Covers:", {
    x: 48,
    y: 598,
    size: 9,
    font: helv,
    color: MUTED,
  });
  [
    ["Encore tool catalog", "Wire CRM actions (clients, loans, SMS, tasks, docs) as MCP tools"],
    ["OAuth + consent", "Claude / Cursor connect, revoke UI, platform-owner scoping"],
    ["Safety gates", "Confirm-gated writes, rate limits, full audit logging"],
    ["Owner training", "Live walkthrough + day-to-day AI Ops playbook"],
    ["Go-live support", "First-week check-in and issue triage"],
  ].forEach(([left, right], i) => {
    const y = 574 - i * 20;
    p2.drawRectangle({
      x: 48,
      y: y - 4,
      width: 516,
      height: 20,
      color: i % 2 === 0 ? LIGHT : WHITE,
    });
    p2.drawText(left, { x: 56, y, size: 9, font: helvBold, color: INK });
    p2.drawText(right, { x: 190, y, size: 8.5, font: helv, color: MUTED });
  });

  // 2. Monthly
  sectionTitle(p2, "2. MONTHLY SEAT — $300 / MO", 48, 456, helvBold);
  p2.drawText(
    "Recurring per platform-owner Claude/Cursor connection. Includes:",
    { x: 48, y: 438, size: 9, font: helv, color: INK },
  );
  [
    "1 active AI connection (Claude Desktop or Cursor MCP)",
    "3,000 MCP tool calls / month included in the seat",
    "Ongoing audit export access + support for that seat",
    "Connector updates as Encore features evolve",
  ].forEach((t, i) => bullet(p2, t, 48, 416 - i * 16, helv));

  // 3. Add-ons
  sectionTitle(p2, "3. ADD-ONS (ONLY IF NEEDED)", 48, 336, helvBold);
  p2.drawRectangle({ x: 48, y: 310, width: 516, height: 18, color: NAVY });
  p2.drawText("Item", { x: 56, y: 315, size: 8, font: helvBold, color: WHITE });
  p2.drawText("Price", {
    x: 200,
    y: 315,
    size: 8,
    font: helvBold,
    color: WHITE,
  });
  p2.drawText("When it applies", {
    x: 300,
    y: 315,
    size: 8,
    font: helvBold,
    color: WHITE,
  });
  [
    ["Extra seat", "$99 / mo", "Each additional platform-owner connection"],
  ].forEach((r, i) => {
    const y = 292 - i * 20;
    p2.drawRectangle({
      x: 48,
      y: y - 4,
      width: 516,
      height: 20,
      color: i % 2 === 0 ? LIGHT : WHITE,
    });
    p2.drawText(r[0], { x: 56, y, size: 9, font: helvBold, color: INK });
    p2.drawText(r[1], { x: 200, y, size: 9, font: helv, color: INK });
    p2.drawText(r[2], { x: 300, y, size: 9, font: helv, color: MUTED });
  });

  // 4. Year-1 examples
  sectionTitle(p2, "4. EXAMPLE YEAR-1 CASHFLOW", 48, 254, helvBold);
  p2.drawRectangle({ x: 48, y: 228, width: 516, height: 18, color: NAVY });
  p2.drawText("Scenario", {
    x: 56,
    y: 233,
    size: 8,
    font: helvBold,
    color: WHITE,
  });
  p2.drawText("Math", {
    x: 260,
    y: 233,
    size: 8,
    font: helvBold,
    color: WHITE,
  });
  p2.drawText("Amount", {
    x: 480,
    y: 233,
    size: 8,
    font: helvBold,
    color: WHITE,
  });
  [
    ["Kickoff (50% setup)", "$2,500 deposit to start", "$2,500", false],
    ["Go-live (setup balance + seat)", "$2,500 + $300", "$2,800", false],
    ["Months 2–12", "$300 x 11", "$3,300", false],
    ["Year 1 total (1 seat)", "", "$8,600", true],
    ["Optional: 2nd seat all year", "$99 x 12", "+ $1,188", false],
  ].forEach(([scenario, math, amount, highlight], i) => {
    const y = 210 - i * 18;
    p2.drawRectangle({
      x: 48,
      y: y - 4,
      width: 516,
      height: 18,
      color: highlight ? SOFT : i % 2 === 0 ? LIGHT : WHITE,
    });
    p2.drawText(scenario, {
      x: 56,
      y,
      size: 8.5,
      font: highlight ? helvBold : helv,
      color: INK,
    });
    p2.drawText(math, { x: 260, y, size: 8.5, font: helv, color: MUTED });
    p2.drawText(amount, {
      x: 480,
      y,
      size: 8.5,
      font: helvBold,
      color: INK,
    });
  });

  // 5. Not included
  sectionTitle(p2, "5. BILLED SEPARATELY (NOT IN THIS QUOTE)", 48, 112, helvBold);
  [
    "Encore platform subscription (your existing monthly plan)",
    "SMS · email · Mortgi usage meters and top-up packs",
    "Claude / Cursor model tokens (owner's Anthropic or Cursor account)",
  ].forEach((t, i) => bullet(p2, t, 48, 94 - i * 14, helv));

  drawFooter(p2, helv, helvBold, 2, 2);

  const out = join(__dirname, "encore-mcp-pricing.pdf");
  writeFileSync(out, await pdf.save());
  console.log("Wrote", out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
