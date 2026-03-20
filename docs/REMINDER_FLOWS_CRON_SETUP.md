# Reminder Flows — cPanel Cron Job Setup

## Overview

The reminder flow execution engine is driven by a single API endpoint that must be called on a schedule.  
Every time the cron runs it picks up all active flow executions whose `next_execution_at` has passed and advances them one step.

**Endpoint:** `GET /api/cron/process-reminder-flows`  
**Recommended interval:** Every 10 minutes  
**Authentication:** `CRON_SECRET` env var (same one used for inbound email polling)

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
