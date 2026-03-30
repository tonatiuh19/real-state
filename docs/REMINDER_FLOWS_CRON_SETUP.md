# Reminder Flows — Cron + Webhook Setup

## Overview

The reminder flow execution engine keeps **conversations** and **automation** fully synchronised.
Every automated message (email/SMS/WhatsApp) creates or updates a conversation thread.
When a client replies, the system detects the response and advances (or stops) the flow automatically.

**Three moving parts:**

| Component                              | Trigger             | Purpose                                                       |
| -------------------------------------- | ------------------- | ------------------------------------------------------------- |
| `GET /api/cron/process-reminder-flows` | Every 10 min (cron) | Advance due flow steps, send messages, handle timeouts        |
| `GET /api/cron/poll-inbound-email`     | Every 5 min (cron)  | Poll IMAP inbox for email replies → mark executions responded |
| `POST /api/webhooks/inbound-sms`       | Real-time (Twilio)  | Receive SMS replies → mark executions responded               |

---

## 1. Set environment variables

Add these to your server environment (HostGator cPanel → **Software → Setup Node.js App** or `.env`):

```
# Shared secret for cron endpoints (pass as ?secret= or Authorization: Bearer)
CRON_SECRET=replace_with_a_long_random_string

# IMAP credentials for polling email replies
IMAP_HOST=mail.yourdomain.com
IMAP_PORT=993
IMAP_USER=reply@yourdomain.com
IMAP_PASSWORD=your-email-password
IMAP_TLS=true

# Inbound webhook shared secret (for email webhook + SMS webhook)
INBOUND_WEBHOOK_SECRET=another_long_random_string
```

Generate strong values:

```bash
openssl rand -hex 32
```

---

## 2. Add cron jobs in cPanel

1. Log in to **cPanel**.
2. Go to **Advanced → Cron Jobs**.
3. Add each job below.

### 2a. Process reminder flow executions — every 10 minutes

| Field   | Value  |
| ------- | ------ |
| Minute  | `*/10` |
| Hour    | `*`    |
| Day     | `*`    |
| Month   | `*`    |
| Weekday | `*`    |

```bash
curl -s "https://yourdomain.com/api/cron/process-reminder-flows?secret=YOUR_CRON_SECRET" > /dev/null 2>&1
```

### 2b. Poll IMAP for email replies — every 5 minutes

| Field   | Value |
| ------- | ----- |
| Minute  | `*/5` |
| Hour    | `*`   |
| Day     | `*`   |
| Month   | `*`   |
| Weekday | `*`   |

```bash
curl -s "https://yourdomain.com/api/cron/poll-inbound-email?secret=YOUR_CRON_SECRET" > /dev/null 2>&1
```

> Run the email poll **more frequently** than the flow processor so replies are captured before a `no_response` timeout expires.

---

## 3. Configure Twilio Inbound SMS webhook

For SMS reply detection (real-time — no polling delay):

1. Log in to **Twilio Console → Phone Numbers → Active Numbers**.
2. Click your SMS-enabled phone number.
3. Under **Messaging → A Message Comes In**, set:
   - **Webhook URL:** `https://yourdomain.com/api/webhooks/inbound-sms`
   - **HTTP Method:** `POST`
4. Save.

The endpoint returns an empty TwiML `<Response>` (no auto-reply to client).

Optionally protect it by setting `INBOUND_WEBHOOK_SECRET` in your environment and adding the header `X-Webhook-Secret: <value>` in Twilio's webhook settings.

---

## 4. How the full bidirectional flow works

```
Loan status changes (e.g. "prequalified")
  → triggerReminderFlows() called
  → INSERT reminder_flow_executions
      conversation_id = 'conv_client_{id}_loan_{id}_flow_{id}'
      next_execution_at = NOW() + trigger_delay_days

Every 10 min — process-reminder-flows cron
  → Finds executions WHERE next_execution_at <= NOW() AND status='active'
  → For each execution, processFlowExecution():

      [trigger] → advance to next step
      [send_email] → sendEmailMessage() with conv_id
                   → INSERT communications (outbound)
                   → DB trigger upserts conversation_threads
                   → execution.conversation_id ensured
      [send_sms]   → sendSMSMessage() with conv_id (same)
      [wait_for_response] incoming:
        if responded_at set  → take 'responded' edge
                               reset responded_at = NULL (fresh for next wait)
        if timeout elapsed   → take 'no_response' edge
        else                 → set next_execution_at = NOW() + timeout → sleep

─── Client replies by EMAIL ──────────────────────────────────────────────────

  Option A — IMAP poll (every 5 min):
    GET /api/cron/poll-inbound-email
    → Fetches unseen inbox messages
    → Extracts conversation_id from In-Reply-To / X-Conversation-Id header
    → INSERT communications (inbound) → DB trigger updates conversation_thread
    → markExecutionsRespondedForConversation(conversation_id)
        → UPDATE reminder_flow_executions
             SET responded_at = NOW(), next_execution_at = NOW()
           WHERE conversation_id = ? AND status = 'active'

  Option B — Email webhook (Postmark / Mailgun / SendGrid):
    POST /api/webhooks/inbound-email
    → Same as Option A (INSERT + mark responded)

─── Client replies by SMS ────────────────────────────────────────────────────

  Twilio webhook (real-time):
    POST /api/webhooks/inbound-sms
    → Looks up client by From phone number
    → Finds latest active execution for that client → get conversation_id
    → INSERT communications (inbound) → DB trigger updates conversation_thread
    → markExecutionsRespondedForConversation(conversation_id)
    → Returns empty TwiML <Response>

─── Next cron tick (within 10 min) ──────────────────────────────────────────

  → Picks up execution now that next_execution_at = NOW()
  → wait_for_response step sees responded_at set → takes 'responded' edge
  → Flow continues (e.g. end, or send a thank-you, or update pipeline status)
```

---

## 5. Conversations as the single source of truth

Every automated message and every client reply is stored in `communications`
and automatically reflected in `conversation_threads` via the DB trigger.

- Brokers see the full exchange in **Admin → Conversations**.
- The `conversation_id` format `conv_client_{clientId}_loan_{loanId}_flow_{flowId}`
  links a thread directly to a specific flow execution.
- `communications.source_execution_id` records which flow execution sent each outbound message.

---

## 6. Manually trigger a test run

```bash
# Process flows
curl -v "https://yourdomain.com/api/cron/process-reminder-flows?secret=YOUR_CRON_SECRET"

# Poll email
curl -v "https://yourdomain.com/api/cron/poll-inbound-email?secret=YOUR_CRON_SECRET"
```

Expected responses:

```json
/* Nothing due */
{ "success": true, "processed": 0, "succeeded": 0, "failed": 0 }

/* After processing */
{ "success": true, "processed": 3, "succeeded": 3, "failed": 0 }
```

---

## 7. Monitoring queries

```sql
-- Active executions and their conversation threads
SELECT rfe.id, rfe.flow_id, rfe.current_step_key, rfe.status,
       rfe.next_execution_at, rfe.responded_at, rfe.conversation_id,
       ct.unread_count, ct.last_message_at
FROM reminder_flow_executions rfe
LEFT JOIN conversation_threads ct ON ct.conversation_id = rfe.conversation_id
WHERE rfe.status = 'active'
ORDER BY rfe.next_execution_at ASC;

-- Failed executions
SELECT id, flow_id, loan_application_id, current_step_key, started_at, updated_at
FROM reminder_flow_executions
WHERE status = 'failed'
ORDER BY updated_at DESC;

-- Recently completed
SELECT id, flow_id, loan_application_id, started_at, completed_at
FROM reminder_flow_executions
WHERE status = 'completed'
ORDER BY completed_at DESC
LIMIT 20;

-- Recent inbound replies (email + SMS)
SELECT id, communication_type, direction, conversation_id, body, created_at
FROM communications
WHERE direction = 'inbound'
ORDER BY created_at DESC
LIMIT 50;
```

---

## 8. Summary of all cron jobs and webhooks

| Endpoint                               | Interval / Trigger                    | Purpose                                                                       |
| -------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------- |
| `GET /api/cron/process-reminder-flows` | `*/10 * * * *`                        | Advance flow executions — send SMS/email, evaluate branches, handle timeouts  |
| `GET /api/cron/poll-inbound-email`     | `*/5 * * * *`                         | Detect email replies → mark executions responded → advance `responded` branch |
| `POST /api/webhooks/inbound-sms`       | Real-time (Twilio)                    | Detect SMS replies → mark executions responded → advance `responded` branch   |
| `POST /api/webhooks/inbound-email`     | Real-time (Postmark/Mailgun/SendGrid) | Detect email replies (alternative to IMAP poll)                               |

---

## 1. Set `CRON_SECRET` in your environment

If you haven't already, add `CRON_SECRET` to your server environment variables (HostGator cPanel → **Software → Setup Node.js App** or your `.env` file):

```
CRON_SECRET=replace_with_a_long_random_string
```

Generate a strong value:

```bash
openssl rand -hex 32
```

The endpoint will return `401 Unauthorized` if the secret does not match.  
If `CRON_SECRET` is not set at all, the endpoint runs without auth (not recommended for production).

---

## 2. Add the cron job in cPanel

1. Log in to **cPanel**.
2. Go to **Advanced → Cron Jobs**.
3. Under **Add New Cron Job**, set the schedule and command as below.

### Schedule — every 10 minutes

| Field   | Value  |
| ------- | ------ |
| Minute  | `*/10` |
| Hour    | `*`    |
| Day     | `*`    |
| Month   | `*`    |
| Weekday | `*`    |

Or paste the shorthand into the **Common Settings** dropdown: **"Once Per 10 Minutes"** (if available), otherwise set the fields manually.

### Command

```bash
curl -s "https://yourdomain.com/api/cron/process-reminder-flows?secret=YOUR_CRON_SECRET" > /dev/null 2>&1
```

Replace:

- `yourdomain.com` → your actual production domain
- `YOUR_CRON_SECRET` → the value you set in step 1

> The `> /dev/null 2>&1` part suppresses output so cPanel doesn't send you an email every 10 minutes.

---

## 3. Also add the inbound email polling cron (if not already set)

This cron checks for client email replies, which triggers the `responded` branch in flows.

### Schedule — every 5 minutes

| Field   | Value |
| ------- | ----- |
| Minute  | `*/5` |
| Hour    | `*`   |
| Day     | `*`   |
| Month   | `*`   |
| Weekday | `*`   |

### Command

```bash
curl -s "https://yourdomain.com/api/cron/poll-inbound-email?secret=YOUR_CRON_SECRET" > /dev/null 2>&1
```

> **Important:** Run the inbound email poll _more frequently_ than the reminder flow processor so that client replies are captured before the `no_response` timeout expires.

---

## 4. How the timing works end-to-end

```
Client status changes to "prequalified"
  → API calls triggerReminderFlows()
  → Creates reminder_flow_executions row with next_execution_at = NOW() + trigger_delay_days

Cron fires (*/10 min)
  → Finds due executions (next_execution_at <= NOW())
  → Runs each execution through the flow engine:
      trigger → send_sms → send_email → wait_for_response (3h timeout)
        next_execution_at = NOW() + 3 hours

Client replies by email
  → poll-inbound-email cron detects the reply
  → Sets responded_at = NOW(), next_execution_at = NOW() on the execution

Next cron tick (within 10 min)
  → Execution resumes at wait_for_response step
  → Takes the "responded" edge → end (removes from automation)

If no reply after 3 hours
  → Cron finds execution whose next_execution_at passed
  → Takes the "no_response" edge → wait 2 days → SMS again → ...
```

---

## 5. Manually trigger a test run

```bash
curl -v "https://yourdomain.com/api/cron/process-reminder-flows?secret=YOUR_CRON_SECRET"
```

Expected response when there is nothing to process:

```json
{ "success": true, "processed": 0, "succeeded": 0, "failed": 0 }
```

Expected response when executions are processed:

```json
{ "success": true, "processed": 3, "succeeded": 3, "failed": 0 }
```

---

## 6. Monitoring

Check the `reminder_flow_executions` table in phpMyAdmin to see execution status:

```sql
-- Active executions due to run
SELECT id, flow_id, loan_application_id, current_step_key, status, next_execution_at
FROM reminder_flow_executions
WHERE status = 'active'
ORDER BY next_execution_at ASC;

-- Failed executions (need investigation)
SELECT id, flow_id, loan_application_id, current_step_key, started_at, updated_at
FROM reminder_flow_executions
WHERE status = 'failed'
ORDER BY updated_at DESC;

-- Recently completed
SELECT id, flow_id, loan_application_id, started_at, completed_at
FROM reminder_flow_executions
WHERE status = 'completed'
ORDER BY completed_at DESC
LIMIT 20;
```

---

## 7. Summary of all cron jobs

| Endpoint                           | Interval       | Purpose                                                                      |
| ---------------------------------- | -------------- | ---------------------------------------------------------------------------- |
| `/api/cron/process-reminder-flows` | `*/10 * * * *` | Advance flow executions (send SMS/email, evaluate branches, handle timeouts) |
| `/api/cron/poll-inbound-email`     | `*/5 * * * *`  | Detect client email replies → trigger `responded` branch                     |
