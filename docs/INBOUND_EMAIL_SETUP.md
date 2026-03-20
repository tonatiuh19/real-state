# Inbound Email (Client Reply Tracking) Setup Guide

Whenever a broker sends an email to a client — whether it's a pipeline notification,
a share-link invite, or a direct message from the Conversations section — the system
embeds a hidden `conversation_id` in the email's `Message-ID` header.

When the client hits **Reply**, their email client automatically copies that header
into `In-Reply-To`. The IMAP poller reads it, routes the reply to the correct
conversation thread, and the broker sees it in the Conversations section with an
unread badge.

**Everything runs on your existing HostGator account. No new provider needed.**

---

## Architecture

```
Broker sends email (HostGator SMTP no-reply@yourdomain.com)
  Message-ID:  <enc-conv_client_5_loan_12-1741234567890@yourdomain.com>
  Reply-To:    reply@yourdomain.com
        ↓
Client hits Reply in Gmail / Outlook / Apple Mail
  In-Reply-To: <enc-conv_client_5_loan_12-1741234567890@yourdomain.com>
  To:          reply@yourdomain.com
        ↓
Email lands in reply@yourdomain.com inbox (HostGator)
        ↓
Cron job hits GET /api/cron/poll-inbound-email every 3 minutes
  (Vercel Cron OR HostGator cPanel cron via curl)
        ↓
IMAP poller reads In-Reply-To → extracts conv_client_5_loan_12
Inserts direction='inbound' communications row
DB trigger increments unread_count on conversation_threads
        ↓
Broker sees reply in Conversations section ✅
```

---

## Step 1 — Create the reply mailbox in HostGator cPanel

1. Log in to **cPanel** → **Email Accounts** → **Create**
2. Username: `reply` (so the address is `reply@yourdomain.com`)
3. Set a strong password — you'll use it as `IMAP_PASSWORD`
4. Quota: 250 MB is plenty (processed emails are marked as read, not deleted)

> You can use any name — `noreply`, `conversations`, etc. Just be consistent.

---

## Step 2 — Find your HostGator mail server hostname

1. cPanel → **Email Accounts** → click **Connect Devices** next to your email
2. Note the **Incoming Server** (IMAP):
   - Host: `mail.yourdomain.com` _(sometimes `box####.hostgator.com`)_
   - Port: **993** (SSL/TLS) ← use this
   - Encryption: SSL/TLS

3. Note the **Outgoing Server** (SMTP) — you already have this for `SMTP_HOST`.

---

## Step 3 — Generate a cron secret

```bash
openssl rand -hex 32
# Example output: a3f8c2e1b4d79f02e6c1a5d8b3f7e042...
```

Save this — it's your `CRON_SECRET`.

---

## Step 4 — Set environment variables

### Local development (`.env` file in project root)

```env
# Outbound SMTP (HostGator)
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no-reply@yourdomain.com
SMTP_PASSWORD=your-noreply-mailbox-password
SMTP_FROM="Encore Mortgage <no-reply@yourdomain.com>"

# Inbound IMAP (HostGator — the reply@ mailbox you just created)
IMAP_HOST=mail.yourdomain.com
IMAP_PORT=993
IMAP_USER=reply@yourdomain.com
IMAP_PASSWORD=your-reply-mailbox-password
IMAP_TLS=true

# Cron protection
CRON_SECRET=a3f8c2e1b4d79f02e6c1a5d8b3f7e042
```

### Vercel (production)

1. Go to your Vercel project dashboard
2. **Settings** → **Environment Variables**
3. Add each variable below, scope: **Production** + **Preview**

| Variable        | Value                                       |
| --------------- | ------------------------------------------- |
| `SMTP_HOST`     | `mail.yourdomain.com`                       |
| `SMTP_PORT`     | `587`                                       |
| `SMTP_SECURE`   | `false`                                     |
| `SMTP_USER`     | `no-reply@yourdomain.com`                   |
| `SMTP_PASSWORD` | _(your no-reply mailbox password)_          |
| `SMTP_FROM`     | `Encore Mortgage <no-reply@yourdomain.com>` |
| `IMAP_HOST`     | `mail.yourdomain.com`                       |
| `IMAP_PORT`     | `993`                                       |
| `IMAP_USER`     | `reply@yourdomain.com`                      |
| `IMAP_PASSWORD` | _(your reply mailbox password)_             |
| `IMAP_TLS`      | `true`                                      |
| `CRON_SECRET`   | _(generated in Step 3)_                     |

4. **Redeploy** the project after saving (Vercel doesn't hot-reload env vars).

---

## Step 5 — Cron job

### Option B — HostGator cPanel Cron ✅ (recommended)

1. cPanel → **Cron Jobs** → **Add New Cron Job**
2. Set **Common Settings** to "Every 5 Minutes"
3. **Command**:
   ```bash
   curl -s -X GET "https://real-state-one-omega.vercel.app/api/cron/poll-inbound-email?secret=YOUR_CRON_SECRET" > /dev/null 2>&1
   ```
   Replace `YOUR_CRON_SECRET` with the value from Step 3.

### Option A — Vercel Cron (alternative, requires Vercel Pro for reliable execution)

Add this to `vercel.json`:

```json
"crons": [
  {
    "path": "/api/cron/poll-inbound-email",
    "schedule": "*/3 * * * *"
  }
]
```

Vercel automatically sends:

```
GET https://yourapp.vercel.app/api/cron/poll-inbound-email
Authorization: Bearer {CRON_SECRET}
```

every 3 minutes.

> **Note:** Vercel Cron on the Hobby plan has a 60-second function timeout and limited reliability.
> cPanel cron is more predictable for this use case.

---

## Step 6 — Test locally

Since the local dev server isn't publicly accessible, trigger the poll manually:

```bash
# Start your dev server first (npm run dev or node api/index.ts)

# Then call the cron endpoint manually:
curl -X GET "http://localhost:8080/api/cron/poll-inbound-email" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"

# Expected response:
# {"success":true,"processed":0,"errors":0}
```

To do a full end-to-end test:

1. From the Conversations page, send an email to a test client
2. Go to that client's email and hit **Reply**, type something
3. Wait up to 5 minutes (or trigger the cron manually)
4. The reply should appear in the Conversations thread

---

## Step 7 — Verify in production

After deploying:

1. Check Vercel **Logs** → filter by `/api/cron/poll-inbound-email`
2. You should see entries like:
   ```
   📥 Inbound reply stored: conv=conv_client_5_loan_12 from=client@gmail.com
   ```
3. In the admin panel, open **Conversations** — the thread should show the client's reply with an unread badge

---

## Troubleshooting

| Symptom                                           | Likely cause          | Fix                                                                    |
| ------------------------------------------------- | --------------------- | ---------------------------------------------------------------------- |
| `{"skipped":true,"reason":"IMAP not configured"}` | Env vars missing      | Double-check `IMAP_HOST/USER/PASSWORD` in Vercel settings + redeploy   |
| `IMAP poll error: Invalid credentials`            | Wrong password        | Verify credentials in cPanel → Email Accounts → Manage                 |
| `IMAP poll error: ECONNREFUSED`                   | Wrong host/port       | Use `mail.yourdomain.com` port `993` with TLS                          |
| Client reply not appearing in conversation        | `In-Reply-To` missing | Client may have forwarded instead of replied — check raw email headers |
| Vercel cron not running                           | Hobby plan limit      | Check Vercel dashboard → Settings → Crons for status                   |
| `{"error":"Unauthorized"}`                        | Wrong CRON_SECRET     | Make sure the env var in Vercel matches what's in the cron URL         |

---

## How the threading works (technical detail)

Every outbound email from this system gets:

```
Message-ID:  <enc-conv_client_5_loan_12-1741234567890@yourdomain.com>
Reply-To:    reply@yourdomain.com
X-Conversation-Id: conv_client_5_loan_12
```

When the client hits Reply, their email client adds:

```
In-Reply-To: <enc-conv_client_5_loan_12-1741234567890@yourdomain.com>
References:  <enc-conv_client_5_loan_12-1741234567890@yourdomain.com>
```

The IMAP poller extracts `conv_client_5_loan_12` from this pattern using the regex:

```
/<enc-([^-]+(?:-[^-]+)*)-\d+@/
```

This works with **every major email client** (Gmail, Outlook, Apple Mail, Yahoo, etc.)
because `In-Reply-To` is part of the RFC 2822 email standard.
