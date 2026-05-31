# Feature Proposal: Realtor Broadcast Center

**"Blast Email & SMS to All My Realtors"**

> **Submitted to:** Platform Owners  
> **Date:** May 28, 2026  
> **Status:** Proposal — Awaiting Approval

---

## 1. Executive Summary

Platform owners today can only communicate with realtors one at a time — via the individual `BrokerDetailPanel` compose view or by manually creating Conversation threads. There is **no way to send a single message to all realtors at once**, which is a critical gap for:

- Announcing rate changes, new loan programs, or market updates
- Re-engaging dormant realtor partners
- Nurturing prospecting pipeline contacts across all stages
- Coordinating time-sensitive campaigns (e.g. holiday closings, DSCR product launches)

This proposal defines a **Realtor Broadcast Center** — a self-contained, platform-owner-only feature that lets any authorized user compose and blast an email, SMS, or both to a filtered subset (or all) of their realtor network in a single action, with full delivery tracking, opt-out compliance, and audit logging.

**The entire feature is buildable on infrastructure already deployed**: Resend (email) and Twilio (SMS) are both initialized and in active use. No new vendors, no new subscriptions.

---

## 2. Problem Statement

| Pain Point                          | Current State                                                | Business Cost                                         |
| ----------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| Announce a rate drop                | Copy-paste 1-by-1 across every realtor's compose panel       | Hours of manual work; message goes out stale          |
| Re-engage cold pipeline prospects   | No bulk action — must open each Kanban card individually     | Entire pipeline stages go un-touched for weeks        |
| Promote a new loan product          | Email drafted externally (Mailchimp, Gmail), outside the CRM | Zero tracking, no thread history, undeliverables lost |
| Coordinate a team-wide announcement | Slack DM or group text — bypasses CRM entirely               | Activity invisible to platform owners, no audit trail |

---

## 3. Proposed Feature: Realtor Broadcast Center

### 3.1 High-Level UX Flow

```
Admin Sidebar → "Broadcasts" (new section)
        ↓
  [New Broadcast] button
        ↓
  Step 1 — Compose
    • Channel: Email | SMS | Both
      (SMS/Both disabled with tooltip if sender has no twilio_caller_id assigned)
    • Subject (email only)
    • Body — rich text email (ReactQuill) or plain text SMS
      ‣ SMS: live character counter + segment count (e.g. "187 chars = 2 segments")
      ‣ SMS: cost multiplier shown per segment (e.g. "2 segments × 50 recipients ≈ $0.79")
    • Merge tags: {{first_name}}, {{last_name}}, {{broker_name}}
    • [Load from template] picker — pulls from existing email_templates / sms_templates
    • Draft auto-saved to backend on every step transition (resumes on re-open)
        ↓
  Step 2 — Audience
    • All Active Realtors (registered brokers with role = broker)
    • Realtor Prospects — filter by stage / tags / owner
    • Custom combination (both above)
    • Live deduplicated recipient count (cross-table dedup by email+phone)
    • Scrollable per-recipient checklist — all selected by default
      ‣ Search within list, Select All / Deselect All
      ‣ Contacts missing required field (no email for email blast, no phone for SMS)
        shown with a warning chip and auto-excluded from that channel
    • Live count badge: "47 of 52 selected (3 skipped — missing phone)"
        ↓
  Step 3 — Schedule
    • Send Now
    • Schedule for later (date + time picker)
      ‣ Displayed and entered in the **sender's timezone** (`brokers.timezone`, e.g. `America/Los_Angeles`)
      ‣ Stored as **UTC** in `scheduled_at` — the wizard converts before submitting
        ↓
  Step 4 — Review & Confirm
    • Summary: channel, audience size, segments per SMS, estimated total cost
    • Preview of personalized message rendered for first recipient
    • Explicit "I confirm" checkbox before [Send Broadcast] button
    • [Cancel] available any time during sending (sets is_cancelled flag)
        ↓
  Broadcast history page — delivery stats per campaign
    • Cancel button visible while status = sending
```

### 3.2 Audience Segmentation Options

The audience step works in **two layers**: coarse segment filters first, then individual recipient review.

**Layer 1 — Segment filters** (selects the pool):

| Segment                         | Source                                        | Filter Criteria                           |
| ------------------------------- | --------------------------------------------- | ----------------------------------------- |
| **All active realtors**         | `brokers` table                               | `role = 'broker'` AND `status = 'active'` |
| **Prospects by pipeline stage** | `realtor_prospects` table                     | `stage IN (...)`                          |
| **Prospects by tag**            | `realtor_prospects.tags` JSON column          | Contains selected tag                     |
| **Prospects by owner broker**   | `realtor_prospects.owner_broker_id`           | Owned by current user                     |
| **Refi rates dropped list**     | `realtor_prospects.add_to_refi_rates_dropped` | `= 1`                                     |
| **Custom multi-select**         | Any combination of the above                  | Platform owner selects                    |

**Layer 2 — Per-recipient selection/deselection** (refines the final list):

After segment filters are applied, the UI renders a **scrollable recipient list** showing every resolved contact (name, company, email/phone). The default state is **all selected** (checkboxes checked). The platform owner can:

- **Deselect individual recipients** — uncheck a specific person to exclude them.
- **Select all / Deselect all** — header checkbox toggles the entire list.
- **Search within the list** — a filter-as-you-type input to find a name quickly in large lists.
- **See a live count badge** — updates in real time as selections change (e.g. _"47 of 52 selected"_).

Excluded recipients are stored in the `audience_filter` JSON on the broadcast record as an `excluded_ids` array:

```json
{
  "segments": ["all_active_realtors"],
  "excluded_ids": [14, 27, 91]
}
```

The server-side `resolveAudience()` function applies segment filters first, then subtracts `excluded_ids` before building the final recipient list. This means the broadcast record is always an accurate snapshot — even if the underlying segment grows after the broadcast is sent.

**Cross-table deduplication:** A contact can exist in both `brokers` (registered realtor) and `realtor_prospects` (same person was also being prospected). Before returning the resolved list, `resolveAudience()` deduplicates by normalized email and last-10-digits of phone across both source tables. The first match wins; the duplicate entry is silently dropped. This prevents a person from receiving the same broadcast twice.

**Missing contact data handling:** Prospects with a `NULL` email for an email broadcast (or `NULL` phone for SMS) are excluded from sending for that channel and logged as `skipped_no_contact` in `realtor_broadcast_recipients`. They still appear in the recipient list with a warning chip so the platform owner is aware and can update the contact record before re-sending. The broadcast is never blocked by missing data — it simply skips the ungracefully unreachable recipients and proceeds.

This covers both the live realtor network AND the entire prospecting pipeline — the two most valuable contact lists in the platform.

### 3.3 Personalization / Merge Tags

The body editor will support the following merge tags, resolved server-side before send:

| Tag                    | Resolved From                                                         |
| ---------------------- | --------------------------------------------------------------------- |
| `{{first_name}}`       | `brokers.first_name` or `realtor_prospects.contact_name` (first word) |
| `{{last_name}}`        | `brokers.last_name`                                                   |
| `{{full_name}}`        | Concatenated first + last                                             |
| `{{broker_name}}`      | Sender's name (the platform owner composing the blast)                |
| `{{company_name}}`     | Tenant's company name from settings                                   |
| `{{unsubscribe_link}}` | Auto-generated compliance link (email only)                           |

---

## 4. Technical Architecture

### 4.1 Database — Two New Tables

**Migration file:** `database/migrations/20260528_120000_realtor_broadcasts.sql`

```sql
-- Broadcast campaign header
CREATE TABLE realtor_broadcasts (
  id              INT NOT NULL AUTO_INCREMENT,
  tenant_id       INT NOT NULL,
  created_by      INT NOT NULL,                          -- broker id (platform owner)
  title           VARCHAR(255) NOT NULL,                 -- internal campaign name
  channel         ENUM('email','sms','both') NOT NULL,
  subject         VARCHAR(500) DEFAULT NULL,             -- email only
  body_email      LONGTEXT DEFAULT NULL,                 -- HTML email body
  body_sms        TEXT DEFAULT NULL,                     -- SMS body (≤ 160 chars recommended)
  audience_filter JSON NOT NULL,                         -- serialized filter config incl. excluded_ids
  recipient_count INT NOT NULL DEFAULT 0,
  status          ENUM('draft','scheduled','sending','sent','failed','cancelled') NOT NULL DEFAULT 'draft',
  is_cancelled    TINYINT(1) NOT NULL DEFAULT 0,         -- checked each iteration in send loop
  scheduled_at    DATETIME DEFAULT NULL,
  started_at      DATETIME DEFAULT NULL,
  completed_at    DATETIME DEFAULT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tenant_status (tenant_id, status),
  KEY idx_scheduled_at (scheduled_at),
  CONSTRAINT fk_rb_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_rb_broker FOREIGN KEY (created_by) REFERENCES brokers(id)
);

-- Per-recipient delivery log
CREATE TABLE realtor_broadcast_recipients (
  id              INT NOT NULL AUTO_INCREMENT,
  broadcast_id    INT NOT NULL,
  tenant_id       INT NOT NULL,
  broker_id       INT DEFAULT NULL,                      -- registered realtor
  prospect_id     INT DEFAULT NULL,                      -- realtor prospect
  recipient_email VARCHAR(255) DEFAULT NULL,
  recipient_phone VARCHAR(30) DEFAULT NULL,
  email_status    ENUM('pending','sent','failed','bounced','unsubscribed','skipped_no_contact') DEFAULT NULL,
  sms_status      ENUM('pending','sent','failed','undelivered','opted_out','skipped_no_contact') DEFAULT NULL,
  email_ext_id    VARCHAR(255) DEFAULT NULL,             -- Resend message ID
  sms_ext_id      VARCHAR(255) DEFAULT NULL,             -- Twilio message SID
  unsubscribe_token VARCHAR(64) DEFAULT NULL,            -- HMAC/UUID for one-click unsubscribe (email)
  conversation_id VARCHAR(255) DEFAULT NULL,             -- links to the communications thread created
  error_message   TEXT DEFAULT NULL,
  sent_at         DATETIME DEFAULT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_broadcast_id (broadcast_id),
  KEY idx_tenant (tenant_id),
  KEY idx_unsubscribe_token (unsubscribe_token),
  CONSTRAINT fk_rbr_broadcast FOREIGN KEY (broadcast_id) REFERENCES realtor_broadcasts(id) ON DELETE CASCADE
);

-- Permanent opt-out list for email (CAN-SPAM)
CREATE TABLE realtor_email_unsubscribes (
  id              INT NOT NULL AUTO_INCREMENT,
  tenant_id       INT NOT NULL,
  email           VARCHAR(255) NOT NULL,
  unsubscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tenant_email (tenant_id, email)
);

-- SMS broadcast opt-in flag on the existing brokers table.
-- This column does NOT exist in the current schema — this ALTER TABLE is required.
-- NULL = not yet collected, 1 = opted in, 0 = opted out (STOP reply received).
ALTER TABLE brokers
  ADD COLUMN sms_blast_opted_in TINYINT(1) DEFAULT NULL
    COMMENT 'NULL = unknown/not asked, 1 = opted in, 0 = opted out (STOP received)';
```

### 4.1.1 Broadcast "From" Number Constraint

This is a **hard architectural constraint** that must be enforced before any SMS broadcast is queued.

**The rule:** Every SMS in a broadcast **must send from the platform owner's own assigned Twilio number** (`brokers.twilio_caller_id`). Sending from a shared inbox number or another broker's personal line is explicitly prohibited.

**Why this matters — the thread collision problem:**

The inbound SMS webhook (`POST /api/webhooks/inbound-sms`) resolves which thread a reply belongs to using the `To` number (the Twilio number that received the SMS). If a realtor replies and the `To` number matches a broker's `twilio_caller_id`, the webhook enforces that broker as the thread owner — overriding any previous assignment. This is by design (personal line ownership rule).

If a broadcast sends from the **shared inbox number**, any reply creates or continues a shared-inbox thread with no clear owner — visible to all brokers, assigned to none. While technically functional, this pollutes the shared inbox with what are essentially personal relationship replies.

If a broadcast sends from **another broker's personal line**, that broker would receive all replies — even though they didn't send the campaign. This is incorrect and breaks the trust model of personal lines.

**The constraint enforced server-side:**

```typescript
// On POST /api/realtor-broadcasts — before queuing
const [callerRow] = await pool.query<RowDataPacket[]>(
  `SELECT twilio_caller_id FROM brokers
   WHERE id = ? AND tenant_id = ? AND twilio_caller_id IS NOT NULL`,
  [brokerId, tenantId],
);

if (!callerRow.length || channel === "sms" || channel === "both") {
  if (!callerRow[0]?.twilio_caller_id) {
    return res.status(400).json({
      success: false,
      error:
        "SMS broadcast requires an assigned Twilio number. Ask your platform admin to assign one to your account.",
    });
  }
}

const fromNumber = callerRow[0].twilio_caller_id; // always the sender's own number
```

**What this means for access:**

| Role                                              | Email Broadcast | SMS Broadcast                                   |
| ------------------------------------------------- | --------------- | ----------------------------------------------- |
| `platform_owner` with `twilio_caller_id` assigned | ✅ Allowed      | ✅ Allowed                                      |
| `platform_owner` without `twilio_caller_id`       | ✅ Allowed      | ❌ Blocked (channel locked to email-only in UI) |
| `admin` or `broker`                               | ❌ Blocked      | ❌ Blocked                                      |

The frontend wizard detects this upfront: when the platform owner has no assigned number, the "SMS" and "Both" channel options are disabled with a tooltip: _"Requires an assigned Twilio number — contact support."_

**The benefit of this constraint:** Every realtor's reply to the broadcast SMS lands in a thread owned by the sender, appears in their personal Conversations inbox, and is tracked 1:1. The broadcast is now a **conversation starter**, not a dead-end push notification.

---

### 4.2 API Endpoints (api/index.ts)

All endpoints are gated behind `verifyBrokerSession` + a `requirePlatformOwner` guard middleware (reuse the existing `brokerRole !== 'platform_owner'` pattern already in the codebase).

| Method   | Route                                    | Description                                                                                                        |
| -------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `POST`   | `/api/realtor-broadcasts/preview`        | Returns deduplicated recipient list + count + skipped-contact warnings for a given filter                          |
| `POST`   | `/api/realtor-broadcasts`                | Create & immediately queue a broadcast (or save as draft)                                                          |
| `PATCH`  | `/api/realtor-broadcasts/:id`            | Update a draft broadcast (auto-save from wizard)                                                                   |
| `PATCH`  | `/api/realtor-broadcasts/:id/cancel`     | Set `is_cancelled = 1` — halts the send loop at the next iteration. Works on `sending` status.                     |
| `GET`    | `/api/realtor-broadcasts`                | List all broadcasts for the tenant (paginated)                                                                     |
| `GET`    | `/api/realtor-broadcasts/:id`            | Fetch a single broadcast with per-channel delivery stats                                                           |
| `GET`    | `/api/realtor-broadcasts/:id/recipients` | Paginated recipient-level delivery detail (includes `skipped_no_contact`, `conversation_id` per row)               |
| `DELETE` | `/api/realtor-broadcasts/:id`            | Hard-delete a `draft` or `scheduled` broadcast only (cannot delete sent/cancelled — audit trail must be preserved) |
| `GET`    | `/api/realtor-broadcasts/unsubscribe`    | Public (no auth) — validates token, records opt-out in `realtor_email_unsubscribes`, returns confirmation page     |

**Key implementation pattern** — the send loop on `POST /api/realtor-broadcasts`:

```typescript
// Pseudocode — follows existing patterns in api/index.ts

// 1. Resolve recipients from filter (deduped, skips missing-contact entries)
const recipients = await resolveAudience(filter, tenantId);

// 2. Insert broadcast header
const broadcastId = await insertBroadcast({
  ...meta,
  recipient_count: recipients.length,
});

// 3. Insert recipient rows (bulk insert, each with a unique unsubscribe_token = crypto.randomUUID())
await insertBroadcastRecipients(broadcastId, recipients);

// 3b. Audit: broadcast created — every high-impact action must be audit-logged
await createAuditLog({
  tenantId,
  actorId: brokerId,
  action: "broadcast_created",
  entityType: "realtor_broadcast",
  entityId: broadcastId,
  metadata: { channel, recipientCount: recipients.length, title },
});

// 4. Queue send loop (non-blocking — fire and forget with error capture)
sendBroadcastAsync(broadcastId, recipients, broadcastData).catch((err) =>
  console.error(`Broadcast #${broadcastId} failed:`, err),
);

res.json({
  success: true,
  broadcast_id: broadcastId,
  recipient_count: recipients.length,
});
```

**Inside `sendBroadcastAsync` — per-message loop:**

```typescript
// Audit: send started
await createAuditLog({
  tenantId, actorId: createdBy, action: 'broadcast_send_started',
  entityType: 'realtor_broadcast', entityId: broadcastId,
  metadata: { channel, recipientCount: recipients.length },
});

let sentCount = 0, failedCount = 0;

for (const recipient of recipients) {
  // Cancellation check — platform owner hit [Cancel] mid-send
  const [check] = await pool.query('SELECT is_cancelled FROM realtor_broadcasts WHERE id = ?', [broadcastId]);
  if (check[0].is_cancelled) {
    await pool.query("UPDATE realtor_broadcasts SET status = 'cancelled', updated_at = NOW() WHERE id = ?", [broadcastId]);
    await createAuditLog({ tenantId, actorId: createdBy, action: 'broadcast_cancelled',
      entityType: 'realtor_broadcast', entityId: broadcastId,
      metadata: { sentCount, failedCount } });
    break;
  }

  // Skip recipients flagged during audience resolution
  if (recipient.skipped) continue;

  // Build Reply-To + Message-ID headers for email — mirrors sendEmailMessage (api/index.ts ~2378).
  // Without this, a realtor's "Reply" in their mail client hits no-reply@... — the reply is lost.
  const conversationId  = `broadcast-${broadcastId}-${recipient.rowId}`;
  const smtpFromEmail   = RESEND_FROM.match(/<([^>]+)>/)?.[1] ?? "noreply@encoremortgage.org";
  const emailDomain     = smtpFromEmail.split("@")[1];
  const messageId       = `<enc-${conversationId}-${Date.now()}@${emailDomain}>`;
  const replyTo         = process.env.IMAP_USER
    ?? `reply+${conversationId}@${process.env.INBOUND_EMAIL_DOMAIN}`;

  // Personalised "From" display name — sender's name, not a generic "Encore Mortgage".
  // Dramatically improves open rates; recipient knows who sent it.
  const senderFrom = `${senderFirstName} ${senderLastName} at ${companyName} <${smtpFromEmail}>`;

  // Send via existing infrastructure
  const { sid, convId } = await sendOneMessage(recipient, broadcastData, {
    fromNumber,
    fromAddress: senderFrom,        // email: personalised display name
    replyTo,                         // email: routes realtor replies into the correct thread
    headers: { "Message-ID": messageId, "X-Conversation-Id": conversationId },
  });

  // CRITICAL: Insert into communications + upsert conversation_thread
  // so inbound replies resolve to the correct thread immediately.
  await pool.query(`INSERT INTO communications (...) VALUES (...)`, [...]);
  await upsertConversationThread({ tenantId, conversationId: convId, ... });

  // Update recipient row with delivery result + conversation_id
  await pool.query(
    `UPDATE realtor_broadcast_recipients SET sms_status = 'sent', sms_ext_id = ?, conversation_id = ?, sent_at = NOW() WHERE id = ?`,
    [sid, convId, recipient.rowId]
  );

  sentCount++;

  // Real-time progress update — frontend subscribes to this Ably channel for live progress bar.
  // Without this the history page shows nothing until the full blast completes.
  await publishToAbly(`broadcast:${broadcastId}`, 'progress', {
    sent: sentCount, failed: failedCount, total: recipients.length,
  });

  await sleep(channelDelay); // 500ms email, 1000ms SMS
}

// Post-loop: audit completion + in-app bell notification to the sender
await createAuditLog({
  tenantId, actorId: createdBy, action: 'broadcast_send_completed',
  entityType: 'realtor_broadcast', entityId: broadcastId,
  metadata: { sentCount, failedCount },
});
await createBrokerNotification({
  brokerIds: [createdBy],
  title: 'Broadcast Complete',
  message: `"${title}" delivered to ${sentCount} of ${recipients.length} contacts.${failedCount > 0 ? ` ${failedCount} failed — check the broadcast detail for errors.` : ''}`,
  category: 'system',
  type: failedCount > 0 ? 'warning' : 'success',
  actionUrl: `/admin/broadcasts/${broadcastId}`,
});
```

**Why `communications` + `upsertConversationThread` is mandatory here:** The inbound SMS webhook resolves replies by looking up the most recent `conversation_threads` row for the sender's phone. If no outbound thread was created when the broadcast was sent, the realtor's reply lands as a new orphan thread with no message history. Creating the thread during send ensures the realtor sees the original broadcast message in context when they reply — identical to how a manually-sent 1:1 message works today.

**Rate limiting / throttling inside `sendBroadcastAsync`**:

- **Email (Resend):** Batched `Promise.allSettled` in groups of 10 with 500ms inter-batch delay.
- **SMS (Twilio):** Sequential `await` per message with 1000ms delay to respect A2P 10DLC carrier throughput limits.
- Both loops write delivery status back to `realtor_broadcast_recipients` in real time.
- **SMS segments:** Before send, compute `Math.ceil(body.length / 160)` and multiply against Twilio's per-segment cost. This is the figure shown in the confirmation step and logged on the broadcast record.

### 4.3 Redux Slice — `realtorBroadcastSlice.ts`

New file: `client/store/slices/realtorBroadcastSlice.ts`

```typescript
// Thunks:
export const previewBroadcastAudience = createAsyncThunk(...)  // GET recipient count
export const createBroadcast = createAsyncThunk(...)           // POST send/schedule
export const fetchBroadcasts = createAsyncThunk(...)           // GET list
export const fetchBroadcastDetail = createAsyncThunk(...)      // GET single + stats
export const deleteBroadcast = createAsyncThunk(...)           // DELETE cancel

// State shape:
interface RealtorBroadcastState {
  broadcasts: RealtorBroadcast[];
  activeBroadcast: RealtorBroadcastDetail | null;
  audiencePreview: { count: number; sample: RecipientPreview[] } | null;
  isLoading: boolean;
  isSending: boolean;
  isPreviewLoading: boolean;
  error: string | null;
}
```

### 4.4 Frontend Page

New page: `client/pages/admin/RealtorBroadcasts.tsx`

**Tab 1 — New Broadcast** (multi-step wizard using existing `BrokerWizard` pattern)

- Step indicators, animated transitions
- Rich text editor (ReactQuill, already a dependency) for email body
- SMS: character counter + live segment count (`Math.ceil(len / 160)`) + estimated cost multiplier
- **[Load from template]** button on the compose step — dispatches `fetchEmailTemplates` / `fetchSmsTemplates` (already in `communicationTemplatesSlice`) and populates the body/subject fields. Reuses existing template infrastructure with zero new API work.
- Live audience count badge updating as filters change (debounced `previewBroadcastAudience` dispatch)
- Scrollable per-recipient checklist with search, Select All / Deselect All, and warning chips for skipped contacts
- Preview panel showing how the message looks with real merge tags resolved against the first recipient
- **Draft auto-save:** wizard dispatches `saveBroadcastDraft` on every step transition. On opening the compose wizard, the slice checks for an existing `draft` broadcast and resumes it instead of starting blank.
- **Cancel mid-send:** history table shows a [Cancel] button for `status = sending` broadcasts. Fires `PATCH /api/realtor-broadcasts/:id/cancel` which sets `is_cancelled = 1` — the send loop checks this flag before each message and halts.

**Tab 2 — Broadcast History**

- Table with columns: Title, Channel, Audience Size, Sent / Failed / Skipped / Pending, Date
- Expandable row → per-recipient delivery log with email/SMS status chips (including `skipped_no_contact`)
- [Cancel] button visible when `status = sending`
- Re-send failed recipients button (Phase 2)

**New sidebar entry** under the `platform_owner` role guard — `admin_section_controls` entry already exists for extensibility.

---

## 5. Compliance & Safety

This feature touches regulated communication channels. The following safeguards are non-negotiable.

### 5.1 Email Compliance (CAN-SPAM)

- Every email blast **must include** a one-click unsubscribe link (`{{unsubscribe_link}}`).
- The server auto-appends a physical mailing address footer (pulled from tenant settings).
- Unsubscribed recipients are stored in `realtor_email_unsubscribes` (defined in Section 4.1 migration) and permanently excluded from future blasts — `resolveAudience()` always joins against this table.
- The `/api/realtor-broadcasts/unsubscribe?token=...` endpoint is public (no auth) and records the opt-out immediately.
- **Token security:** Each recipient's unsubscribe token is a `crypto.randomUUID()` stored in `realtor_broadcast_recipients.unsubscribe_token` at blast creation time. Sequential integers or `recipient_id` values are explicitly **not used** — they would be guessable and allow anyone to unsubscribe others by incrementing the parameter.

### 5.2 SMS Compliance (TCPA / A2P 10DLC)

- SMS is **opt-in only** by default. A new `sms_blast_opted_in` boolean column on the `brokers` table (default `NULL` = unknown) controls eligibility.
- Only realtors with `sms_blast_opted_in = 1` are included in SMS blasts.
- The Realtor Management page exposes the opt-in status and allows manual override by the platform owner with an audit trail.
- Every SMS body includes a `Reply STOP to unsubscribe` footer automatically appended server-side.
- **STOP reply handling must be built as a new Phase 1 task.** The existing `handleInboundSMS` webhook does **not** currently parse STOP messages or record opt-outs anywhere in the codebase — this is a compliance gap that cannot be deferred. Every SMS sent with a "Reply STOP to unsubscribe" footer creates a legal obligation to honour it. The required implementation inside `handleInboundSMS`: if `body.trim().toLowerCase() === 'stop'`, find any broker row whose `twilio_caller_id` matches the Twilio `To` number or whose `phone` matches the sender's `From` number, and set `sms_blast_opted_in = 0`. The broadcast send loop already skips contacts with `sms_blast_opted_in = 0` once this column exists.

### 5.3 Blast Guards

- **Minimum recipient threshold**: The UI warns (not blocks) when sending to fewer than 2 recipients (likely a test vs. an actual blast).
- **Maximum per-day cap**: Two dedicated `system_settings` keys — `broadcast_daily_email_limit` (default: 500) and `broadcast_daily_sms_limit` (default: 200) — enforce the 24-hour rolling window cap. These must be **separate keys** from the existing `mortgi_daily_message_limit` key, which belongs exclusively to the MortgiWidget feature. Sharing that key would cause MortgiWidget sends to consume broadcast quota and vice versa, producing silent throttling failures in both features.
- **Confirmation step**: A final review modal shows the exact audience count, channel, and estimated cost before firing. Requires an explicit "I confirm" checkbox.
- **Role gate**: Only `platform_owner` role can access this feature. `admin` and `broker` roles cannot see or trigger broadcasts.
- **Rate limiting** on the API endpoint: 10 POST requests per 15 minutes per IP (using the `express-rate-limit` package already recommended in the platform audit P0-3 fix).

---

## 6. Delivery & Cost Estimation

Given the existing Resend and Twilio infrastructure:

| Channel        | Unit Cost     | 100 recipients | 500 recipients |
| -------------- | ------------- | -------------- | -------------- |
| Email (Resend) | ~$0.001/email | $0.10          | $0.50          |
| SMS (Twilio)   | ~$0.0079/SMS  | $0.79          | $3.95          |
| Both channels  | Combined      | ~$0.89         | ~$4.45         |

For a typical realtor network of 50–200 contacts, a full blast costs **under $2.00**. The cost preview is shown in the confirmation step.

---

## 7. Implementation Roadmap

### Phase 1 — Core Blast (MVP) · ~6–7 days

| #   | Task                                                                                                   | Owner      |
| --- | ------------------------------------------------------------------------------------------------------ | ---------- |
| 1   | Migration: `realtor_broadcasts`, `realtor_broadcast_recipients`, `realtor_email_unsubscribes` tables   | Backend    |
| 2   | `resolveAudience()` — cross-table dedup + missing-contact skip logic                                   | Backend    |
| 3   | API: `/preview`, `POST /`, `PATCH /:id`, `PATCH /:id/cancel`, `GET /`, `GET /:id`, `GET /unsubscribe`  | Backend    |
| 4   | `sendBroadcastAsync` — email loop: Resend send + `communications` insert + `upsertConversationThread`  | Backend    |
| 5   | `sendBroadcastAsync` — SMS loop: Twilio send + `communications` insert + `upsertConversationThread`    | Backend    |
| 6   | Cancellation check (`is_cancelled` flag) inside both send loops                                        | Backend    |
| 7   | Unsubscribe token generation (`crypto.randomUUID()`) + public unsubscribe endpoint                     | Backend    |
| 8   | `realtorBroadcastSlice.ts` Redux slice (all thunks incl. draft auto-save + cancel)                     | Frontend   |
| 9   | `RealtorBroadcasts.tsx` — compose wizard with template picker, SMS segment counter, per-recipient list | Frontend   |
| 10  | Draft auto-resume on wizard open                                                                       | Frontend   |
| 11  | Sidebar + route registration + `admin_section_controls` entry                                          | Frontend   |
| 12  | Swagger documentation for all new endpoints                                                            | Backend    |
| 13  | Migration: `ALTER TABLE brokers ADD COLUMN sms_blast_opted_in TINYINT(1) DEFAULT NULL`                 | Backend    |
| 14  | **STOP reply handler** in `handleInboundSMS`: parse `body === 'stop'` → set `sms_blast_opted_in = 0`   | Backend    |
| 15  | `createAuditLog()` at broadcast create, send start, send complete, and cancel events                   | Backend    |
| 16  | `createBrokerNotification()` on send completion with sent/failed count + deep-link to detail page      | Backend    |
| 17  | Ably `publishToAbly('broadcast:{id}', 'progress', {...})` in loop + live progress bar on history page  | Full-stack |

### Phase 2 — Analytics & Deliverability · ~3 days

- Open tracking pixel for email (Resend webhook → update `email_status = 'opened'`)
- SMS delivery status sync via existing Twilio status callback webhook
- Broadcast history page with per-recipient drill-down
- Re-send to failed recipients button
- Export recipients list to CSV

### Phase 3 — Advanced Targeting · ~2 days

- Saved audience segments (reusable filter presets)
- **Scheduled broadcasts** — full cron implementation (see below)
- A/B subject line testing for email (50/50 split on resolved audience)

#### Phase 3 Detail: Scheduled Broadcast Cron

The platform already uses a HostGator cPanel cron pattern for reminder flows and message status backfill — both protected by `CRON_SECRET` and called via `curl`. Scheduled broadcasts follow **the exact same pattern**.

**New cron endpoint:**

```
GET /api/cron/process-scheduled-broadcasts?secret=CRON_SECRET
```

**Logic:**

```typescript
/**
 * GET /api/cron/process-scheduled-broadcasts
 *
 * Picks up any realtor_broadcasts with status = 'scheduled'
 * whose scheduled_at <= NOW() and fires them.
 *
 * Schedule via HostGator cPanel cron — every 5 minutes:
 *   curl -s "https://yourdomain.com/api/cron/process-scheduled-broadcasts?secret=CRON_SECRET"
 *
 * Protected by CRON_SECRET (same env var used by all other platform crons).
 */
const handleProcessScheduledBroadcasts: RequestHandler = async (req, res) => {
  const secret = req.query.secret;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const [due] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM realtor_broadcasts
     WHERE status = 'scheduled'
       AND scheduled_at <= NOW()
       AND is_cancelled = 0
     ORDER BY scheduled_at ASC
     LIMIT 10`, // cap per tick to avoid overloading on backlog
  );

  for (const row of due) {
    // Mark as sending immediately to prevent double-pickup on next cron tick
    await pool.query(
      `UPDATE realtor_broadcasts SET status = 'sending', started_at = NOW() WHERE id = ?`,
      [row.id],
    );
    // Fetch full broadcast + recipients and fire the existing send loop
    fireBroadcast(row.id).catch((err) =>
      console.error(`❌ Scheduled broadcast #${row.id} failed:`, err),
    );
  }

  res.json({ success: true, fired: due.length });
};
```

**cPanel cron setup (same as existing reminder-flows cron):**

```
*/5 * * * * curl -s "https://yourdomain.com/api/cron/process-scheduled-broadcasts?secret=YOUR_CRON_SECRET" > /dev/null 2>&1
```

**Key safeguards matching existing platform cron patterns:**

- `LIMIT 10` per tick prevents a backlog of scheduled blasts from all firing simultaneously.
- `status = 'sending'` is set **before** `fireBroadcast()` is called — prevents double-pickup if the cron fires again within the same minute (cPanel minimum interval is 1 minute; the 5-minute schedule gives ample margin).
- `is_cancelled = 0` check in the query — a scheduled broadcast that was cancelled before its send time is never picked up.
- `scheduled_at` is stored in **UTC**. The compose wizard converts the sender's local time (derived from `brokers.timezone`, e.g. `America/Los_Angeles`) to UTC before saving — so `scheduled_at <= NOW()` is always a correct UTC comparison and the blast fires at the time the platform owner intended in their local timezone.
- Protected by `CRON_SECRET` (the same env var already in use) — no new infrastructure or environment variables required.

---

## 8. What This Unlocks for the Business

| Use Case                          | Before                                            | After                                                            |
| --------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| Rate alert to all partners        | 2–4 hours of manual sends                         | 3 minutes, every realtor notified simultaneously                 |
| Re-engage cold pipeline prospects | Manually opening each Kanban card                 | One broadcast filtered to `contact_attempted` stage, done        |
| New product launch                | External Mailchimp campaign, zero CRM correlation | Native broadcast, every response auto-threads into Conversations |
| Weekly market update              | Inconsistent, some realtors missed                | Scheduled weekly blast, 100% coverage, full delivery log         |
| Compliance demonstration          | No audit trail                                    | Full per-recipient log with timestamps, statuses, and opt-outs   |

---

## 9. Dependencies & Prerequisites

| Dependency                                           | Status                                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ | --- | ---------------------------------------- | ------------------------------------------------------------------------------- |
| Resend email client                                  | ✅ Already initialized (`resendClient`)                                              |
| Twilio SMS client                                    | ✅ Already initialized (`twilioClient`)                                              |
| `communications` insert + `upsertConversationThread` | ✅ Pattern exists in `handleSendMessage` — reuse directly                            |
| Email templates infrastructure                       | ✅ `email_templates` table + `fetchEmailTemplates` thunk in slice — wire into wizard |
| SMS templates infrastructure                         | ✅ `sms_templates` table + `fetchSmsTemplates` thunk in slice — wire into wizard     |
| Realtor Prospects data                               | ✅ `realtor_prospects` table with email, phone, stage, tags                          |
| Brokers data                                         | ✅ `brokers` table with email, phone, `twilio_caller_id`                             |
| Role-based access control                            | ✅ `platform_owner` guard pattern already in every realtor-prospects endpoint        |
| ReactQuill rich text editor                          | ✅ Already a dependency (used in `CommunicationTemplates.tsx`)                       |
| Redux async thunk pattern                            | ✅ Established in `communicationTemplatesSlice`, `realtorProspectingSlice`           |
| `crypto.randomUUID()` for unsubscribe tokens         | ✅ Node.js built-in — no new dependency                                              |
| Rate limiting (express-rate-limit)                   | ⚠️ Needs to be installed (already flagged as P0-3 in platform audit)                 |     | `createBrokerNotification` + Ably fanout | ✅ Already implemented — wire into broadcast send completion (Phase 1 task #16) |
| `createAuditLog` helper                              | ✅ Already implemented — must be called at create, start, complete, cancel events    |
| `publishToAbly` for live progress events             | ✅ `ablyClient` initialized — channel: `broadcast:{broadcastId}` (Phase 1 task #17)  |
| `sms_blast_opted_in` column on `brokers`             | ❌ Requires migration `ALTER TABLE brokers ADD COLUMN` (Phase 1 task #13)            |
| STOP reply handler in `handleInboundSMS`             | ❌ Must be implemented — currently absent from codebase (Phase 1 task #14)           |

The only missing piece is `express-rate-limit` — already flagged as a critical security gap in the Q2 platform audit. Installing it for this feature simultaneously closes that security finding.

---

## 10. Risks & Mitigations

| Risk                                                       | Likelihood                      | Mitigation                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accidental blast to wrong audience                         | Medium                          | Mandatory audience preview + per-recipient checklist + explicit "I confirm" checkbox before send                                                                                                                                                                        |
| No conversation thread → orphan replies                    | **Certain if missed**           | Every broadcast message inserts into `communications` + calls `upsertConversationThread` — same as 1:1 sends                                                                                                                                                            |
| Duplicate sends (contact in both brokers + prospects)      | Medium                          | `resolveAudience()` deduplicates by normalized email + last-10 phone digits before building recipient list                                                                                                                                                              |
| Blast from wrong Twilio number → thread collision on reply | High if unguarded               | Server-side hard block: broadcast SMS must send from `brokers.twilio_caller_id`; UI disables SMS channel if no number is assigned                                                                                                                                       |
| SMS cost miscalculation (multi-segment bodies)             | Medium                          | UI shows segment count + cost multiplier live; server uses `Math.ceil(body.length / 160)` for estimate                                                                                                                                                                  |
| Guessable unsubscribe token → mass opt-out attack          | Low but serious                 | Token is `crypto.randomUUID()` per recipient — not sequential ID or `recipient_id`                                                                                                                                                                                      |
| SMS opt-out not honored → TCPA liability                   | High if ignored                 | `sms_blast_opted_in` flag is a hard block; STOP reply auto-sets flag; broadcast loop skips opted-out contacts                                                                                                                                                           |
| Platform owner cancels mid-send but messages keep going    | Medium                          | `is_cancelled` flag checked before every message in the send loop; status set to `cancelled` immediately                                                                                                                                                                |
| Missing contact data blocks entire broadcast               | Medium                          | Recipients with no email/phone for the selected channel are logged as `skipped_no_contact` and skipped — blast is never blocked                                                                                                                                         |
| Draft work lost on browser refresh                         | Medium                          | Wizard auto-saves to backend on each step; re-opening the wizard resumes the existing draft                                                                                                                                                                             |
| Resend rate limit exceeded on large blasts                 | Low (< 500 contacts)            | Throttled 10/batch with 500ms delay; error captured per-recipient, not fail-all                                                                                                                                                                                         |
| Twilio sending suspended (A2P non-compliance)              | **High until Phase 1 complete** | STOP handler does **not** exist in the current codebase — must be built as Phase 1 task #14. Until then, every SMS with a "Reply STOP" footer is an unenforceable promise. Blast excludes opted-out contacts once handler and `sms_blast_opted_in` column are in place. |
| Spam reputation damage                                     | Low                             | Unsubscribe link auto-appended; bounce/complaint webhooks mark contact as suppressed in `realtor_email_unsubscribes`                                                                                                                                                    |
| Cost runaway                                               | Low                             | Separate `system_settings` keys `broadcast_daily_email_limit` (500) / `broadcast_daily_sms_limit` (200) + real-time cost preview with segment multiplier. Keys are distinct from `mortgi_daily_message_limit` to avoid cross-feature quota interference.                |

---

## 11. Recommendation

**Approve Phase 1 immediately.**

The feature is **100% buildable on existing infrastructure** with zero new vendors or contracts. It directly addresses one of the highest-friction workflows on the platform and represents a strong retention/expansion argument for platform owners onboarding new mortgage companies. Combined with the existing Realtor Prospecting Board, this turns the platform into a genuine outbound sales engine for realtor partner acquisition — not just a loan processing tool.

Phase 1 deliverable: a platform-owner can compose a message, select their audience, and blast email + SMS to every realtor and/or prospect in their network in under 3 minutes, with a full delivery log.

---

_Prepared by: Engineering Team_  
_Reviewed by: —_  
_Approved by: —_
