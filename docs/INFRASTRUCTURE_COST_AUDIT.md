# Infrastructure Cost Audit

**Encore Mortgage CRM** · 500 Concurrent Users · April 9, 2026

---

## Services Detected in Codebase

> Source of truth: `.env`, `api/index.ts`, `vercel.json`, `package.json`

| #   | Service                 | Role                                                             |
| --- | ----------------------- | ---------------------------------------------------------------- |
| 1   | **Vercel**              | Hosting — frontend SPA + serverless API                          |
| 2   | **Ably**                | Real-time pub/sub — notifications, live updates                  |
| 3   | **Zoom**                | Video meeting scheduling (Server-to-Server OAuth)                |
| 4   | **TiDB Cloud**          | Managed MySQL-compatible database (Serverless)                   |
| 5   | **disruptinglabs.com**  | Custom CDN — avatar & document image storage                     |
| 6   | **SendGrid Essentials** | Transactional email — outbound notifications, reminders, invites |
| 7   | **IMAP (Hostgator)**    | Inbound email polling via `reply@disruptinglabs.com`             |

> **Note:** Twilio (SMS + voice) excluded per request.  
> **Note:** Domain `encoremortgage.org` not costed — assumed separately managed.

---

## 💰 Cost Summary at a Glance

| Service                         | Low          | Mid-Range    | High         |
| ------------------------------- | ------------ | ------------ | ------------ |
| Vercel (Pro + usage)            | $50          | $65          | $80          |
| Ably (Standard + usage)         | $52          | $63          | $75          |
| Zoom (Pro, broker licenses)     | $16          | $133         | $267         |
| TiDB Cloud (Serverless + usage) | $25          | $38          | $50          |
| disruptinglabs CDN              | $10          | $20          | $30          |
| SendGrid (Essentials → Pro)     | $20          | $20          | $90          |
| **TOTAL**                       | **~$173/mo** | **~$339/mo** | **~$592/mo** |

> 🎯 **Realistic monthly spend at 500 concurrent users: ~$260 – $400**  
> 💡 With caching + Zoom annual billing optimizations applied: **~$190 – $300/month**

---

## 1. Vercel

> [vercel.com/pricing](https://vercel.com/pricing)

**Required plan: Pro** _(Hobby is personal/non-commercial only)_

### Included in Pro — $20/month base

| Quota                           | Included             |
| ------------------------------- | -------------------- |
| Serverless Function Invocations | 1,000,000 / month    |
| Active CPU Time (Fluid Compute) | 4 hours / month      |
| Provisioned Memory              | 360 GB-hours / month |
| Fast Data Transfer (CDN egress) | 100 GB / month       |
| Edge Requests                   | 1,000,000 / month    |
| Fast Origin Transfer            | 10 GB / month        |

### Overage Rates

| Metric                   | Rate             |
| ------------------------ | ---------------- |
| Additional invocations   | $0.60 / million  |
| Additional fast transfer | $0.15 / GB       |
| Additional active CPU    | $0.18 / CPU-hour |

### 500-User Usage Estimate

**SPA static assets** — Served from Vercel CDN edge, effectively $0 after cache warm-up.

**API Serverless Invocations:**

```
500 users × 8 calls/min × 60 min × 8 hrs/day × 22 workdays = ~52.8M invocations/month
Included: 1M → Extra: ~51.8M × $0.60/M = ~$31.08
```

**Fast Data Transfer:**

```
500 users × ~500 KB avg response × 8 hrs × 22 days ≈ 44 GB → within 100 GB included → $0
```

**Active CPU Time** _(Fluid Compute charges ACTIVE CPU only, not DB wait time)_:

```
Conservative: 52.8M invocations × 0.01s CPU = 528,000 CPU-secs ≈ 147 hrs
Extra: ~143 hrs × $0.18 = ~$25.74
```

### Monthly Estimate

| Line Item                    | Low Cost       | High Cost      | What drives it higher                                   |
| ---------------------------- | -------------- | -------------- | ------------------------------------------------------- |
| Base plan                    | $20.00         | $20.00         | Fixed                                                   |
| Function invocations overage | ~$15           | ~$50           | More API calls per user, longer sessions, no caching    |
| Active CPU overage           | ~$10           | ~$40           | Heavy endpoints: PDF generation, bulk queries, AI tasks |
| Data transfer                | $0.00          | $10.00         | Large payload responses, file downloads                 |
| **Estimated Total**          | **~$50/month** | **~$80/month** |                                                         |

### Scaling Notes

- PDF generation or AI-heavy endpoints will increase CPU time significantly — monitor via Vercel Usage Dashboard.
- Adding `Cache-Control` headers to read-heavy endpoints can reduce invocations by 40–60%.
- Enterprise plan available for predictable fixed pricing + 99.99% SLA.

---

## 2. Ably

> [ably.com/pricing](https://ably.com/pricing)

**Required plan: Standard** _(Free tier caps at 200 concurrent connections — insufficient for 500 users)_

### Plans

| Plan         | Price                 | Concurrent Connections | Concurrent Channels |
| ------------ | --------------------- | ---------------------- | ------------------- |
| Free         | $0                    | 200                    | 200                 |
| **Standard** | **$29/month + usage** | **10,000**             | **10,000**          |
| Pro          | $399/month + usage    | 50,000                 | 50,000              |

### Usage Rates (all paid plans)

| Metric             | Rate                 |
| ------------------ | -------------------- |
| Messages           | $2.50 / million      |
| Connection minutes | $1.00 / million mins |
| Channel minutes    | $1.00 / million mins |
| Data transfer      | $0.25 / GiB          |

### How Ably Is Used

- Server publishes real-time events (loan status, messages, tasks, voice call events)
- Each logged-in user holds 1 persistent WebSocket connection
- Channels: per-loan, per-conversation, per-broker notification

### 500-User Usage Estimate

> Session assumption: 500 users × 8 hrs/day × 22 workdays

**Connection minutes:**

```
500 connections × 8 hrs × 60 min × 22 days = 5,280,000 min
Cost: 5.28M × $1.00/M = $5.28
```

**Channel minutes** _(avg 3 channels/user: notification + loan + conversation)_:

```
1,500 channels × 8 hrs × 60 min × 22 days = 15,840,000 min
Cost: 15.84M × $1.00/M = $15.84
```

**Messages:**

```
80 messages/user/day × 500 users × 22 days = 880,000 ≈ 0.88M
Cost: 0.88M × $2.50/M = $2.20
```

### Monthly Estimate

| Line Item           | Low Cost       | High Cost      | What drives it higher                                                      |
| ------------------- | -------------- | -------------- | -------------------------------------------------------------------------- |
| Standard base plan  | $29.00         | $29.00         | Fixed                                                                      |
| Connection minutes  | $4.00          | $10.00         | Users staying logged in longer, more active days/month                     |
| Channel minutes     | $10.00         | $25.00         | More channels per user (e.g. multiple loans open simultaneously)           |
| Messages            | $1.50          | $5.00          | High-frequency events: voice calls, rapid task updates, bulk notifications |
| **Estimated Total** | **~$52/month** | **~$75/month** |                                                                            |

### Scaling Notes

- Connection + channel minute costs scale linearly with session duration.
- Optimize with presence heartbeat tuning to reduce idle connection time.
- Upgrade to Pro ($399/month) only if approaching 10k concurrent connections.

---

## 3. Zoom

> [zoom.com/pricing](https://zoom.com/pricing)

**Integration model:** One central Zoom account creates meetings programmatically via Server-to-Server OAuth API. Client joins for free.

> ⚠️ `.env` shows placeholder values (`your_zoom_account_id`) — Zoom integration may not be fully active yet.

### Plan Options

| Plan         | Monthly Billing | Annual Billing  | Attendees          |
| ------------ | --------------- | --------------- | ------------------ |
| Basic (Free) | $0              | $0              | 100 (40-min limit) |
| **Pro**      | **$15.99/user** | **$13.33/user** | **100**            |
| Business     | ~$23.00/user    | $18.32/user     | 300                |

> ✅ **Pro** supports Server-to-Server OAuth API, unlimited meeting duration, 5 GB cloud recording.

### 500-User Clarification

**500 concurrent CRM users ≠ 500 Zoom licenses.** Only brokers hosting meetings need licenses. Clients always join for free.

### Scenarios

| Scenario        | Description                                         | Monthly Cost |
| --------------- | --------------------------------------------------- | ------------ |
| A — Minimum     | 1 central API account, all meetings under 1 license | ~$16         |
| B — Realistic   | 10 broker licenses (annual billing)                 | ~$133        |
| C — Larger team | 20 broker licenses (annual billing)                 | ~$267        |

### Monthly Estimate

| Scenario        | Cost        | Broker licenses         | What drives it higher                                   |
| --------------- | ----------- | ----------------------- | ------------------------------------------------------- |
| A — Minimum     | ~$16/month  | 1 (central API account) | Suitable only for small teams using single host account |
| B — Realistic   | ~$133/month | 10 (annual billing)     | Each broker needs their own hosted meeting identity     |
| C — Larger team | ~$267/month | 20 (annual billing)     | Scales 1:1 with number of brokers hosting meetings      |

### Scaling Notes

- Zoom licenses scale with **number of brokers**, not total CRM users.
- Annual billing saves ~17% vs monthly.
- Consider a Zoom Business Associate Agreement for handling mortgage PII data.

---

## 4. TiDB Cloud Serverless

> [pingcap.com/tidb-cloud-pricing](https://www.pingcap.com/tidb-cloud-pricing/)

**Current tier: TiDB Cloud Starter (Serverless)**  
Confirmed from `DB_HOST: gateway01.us-east-1.prod.aws.tidbcloud.com`

### Free Quota (per org, up to 5 clusters)

| Resource            | Free Tier           |
| ------------------- | ------------------- |
| Row-based storage   | 25 GiB / month      |
| Columnar storage    | 25 GiB / month      |
| Request Units (RUs) | 250,000,000 / month |
| Scale to zero       | ✅                  |

### Overage Rates

| Resource          | Rate              |
| ----------------- | ----------------- |
| Row-based storage | $0.20 / GiB-month |
| Columnar storage  | $0.05 / GiB-month |
| Request Units     | $0.10 / 1M RUs    |

### What Is a Request Unit (RU)?

| Operation           | RU Cost |
| ------------------- | ------- |
| 64 KiB read payload | 1 RU    |
| 2 KiB write payload | 1 RU    |
| 3ms SQL CPU time    | 1 RU    |

### 500-User Usage Estimate

**Storage:**

```
Estimated DB size: 5–15 GiB row storage → within 25 GiB free
Documents stored as CDN URLs (not blobs) → storage stays lean → $0
```

**Request Units:**

```
500 users × 20 RUs/request × 5 requests/min × 60 × 8 hrs × 22 days
= 528,000,000 RUs/month
Free: 250M → Extra: ~278M × $0.10/M = $27.80
```

> Complex JOINs (loans + tasks + documents + conversations) consume more RUs — estimate is conservative.

### Monthly Estimate

| Line Item                      | Low Cost       | High Cost      | What drives it higher                                    |
| ------------------------------ | -------------- | -------------- | -------------------------------------------------------- |
| Free quota (250M RUs + 25 GiB) | $0.00          | $0.00          | Included                                                 |
| RU overage                     | ~$15           | ~$40           | Complex JOINs, no query caching, high write volume       |
| Storage overage                | $0.00          | $10.00         | DB growth beyond 25 GiB (documents metadata, audit logs) |
| **Estimated Total**            | **~$25/month** | **~$50/month** |                                                          |

### Scaling Notes

- Set a **Spending Limit** in TiDB Cloud console to prevent bill surprises.
- If costs consistently exceed $100/month, evaluate **TiDB Cloud Essential** (~$600/month) for dedicated compute + 99.99% SLA.
- Implement app-layer caching (Vercel KV / Redis) for read-heavy endpoints to slash RU consumption.

---

## 5. disruptinglabs.com CDN

**Used in:** `client/lib/cdn-upload.ts`

| Detail          | Value                                                  |
| --------------- | ------------------------------------------------------ |
| Upload endpoint | `https://disruptinglabs.com/data/api/uploadImages.php` |
| Serve endpoint  | `https://disruptinglabs.com/data/api/<path>`           |
| Pricing model   | No public pricing — custom/proprietary hosting         |

### Estimated Cost

- Likely bundled with an existing Hostgator/VPS contract.
- **Estimated: $10 – $30/month** (or $0 if already included in hosting plan)

### ⚠️ Recommendation

This is a **single point of failure** for all avatar images. Consider migrating to:

| Option                            | Cost                            |
| --------------------------------- | ------------------------------- |
| Vercel Blob (already on Pro plan) | 1 GB included, $0.023/GB beyond |
| Cloudflare R2                     | $0.015/GB storage, free egress  |
| AWS S3 + CloudFront               | ~$0.023/GB storage + egress     |

---

## 6. Email — SendGrid (Outbound) + IMAP (Inbound)

**Used in:** `api/index.ts` SMTP + IMAP configuration

> ⚠️ **SendGrid does NOT support IMAP.** SendGrid is a purely outbound transactional email API — it sends emails, it does not receive or host mailboxes. IMAP inbound polling must remain on a separate mail host (currently Hostgator).

| Role                       | Solution                                           | Notes                                                        |
| -------------------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| Outbound (transactional)   | **SendGrid Essentials API**                        | Replaces `no-reply-encore-mortgage@disruptinglabs.com`       |
| Outbound (reminders)       | **SendGrid Essentials API**                        | Replaces `no-reply@garbrix.com` — both accounts consolidated |
| Inbound (reply processing) | **IMAP on Hostgator** — `reply@disruptinglabs.com` | Stays on Hostgator; SendGrid cannot receive email            |

### SendGrid Essentials — $19.95/month

| Feature                          | Value               |
| -------------------------------- | ------------------- |
| Emails / month                   | 50,000              |
| Dedicated IP                     | ❌ (shared IP pool) |
| Domain authentication (SPF/DKIM) | ✅                  |
| Real-time analytics              | ✅                  |
| Event Webhook                    | ✅ (1 included)     |
| 99.999% uptime SLA               | ✅                  |
| Support                          | Email               |

### SendGrid Pro — $89.95/month _(upgrade path)_

| Feature                      | Value                 |
| ---------------------------- | --------------------- |
| Emails / month               | 100,000               |
| Dedicated IP                 | ✅ 1 included         |
| Email address validation API | ✅ (2,500 free/month) |
| Activity history             | 7 days                |
| Support                      | Email + priority      |

### Monthly Estimate

| Scenario       | Cost             | Emails/Month | What drives it higher                                             |
| -------------- | ---------------- | ------------ | ----------------------------------------------------------------- |
| **Essentials** | **$19.95/month** | 50,000       | Default — shared IP, solid deliverability                         |
| **Pro**        | **$89.95/month** | 100,000      | Dedicated IP needed (compliance, reputation control, high volume) |

> ⚠️ **IMAP inbound** (`reply@disruptinglabs.com`) is NOT handled by SendGrid — it remains on Hostgator at no extra cost if already included in the hosting plan. If Hostgator hosting is ever cancelled, a separate IMAP solution (e.g. [Mailbox.org](https://mailbox.org) ~$3/month, or keeping a minimal hosting plan) will be needed for inbound reply processing.

---

## Total Monthly Cost Summary

| Service                         | Low Estimate    | High Estimate   | What drives cost higher                                             |
| ------------------------------- | --------------- | --------------- | ------------------------------------------------------------------- |
| Vercel (Pro + usage)            | $50             | $80             | More API calls, heavy CPU endpoints (PDF, AI), no caching           |
| Ably (Standard + usage)         | $52             | $75             | Longer user sessions, more channels per user, high-frequency events |
| Zoom (Pro, broker licenses)     | $16             | $267            | More broker licenses — scales 1:1 with team size                    |
| TiDB Cloud (Serverless + usage) | $25             | $50             | Complex JOIN queries, high write volume, no app-layer caching       |
| disruptinglabs CDN              | $10             | $30             | More image uploads, VPS tier upgrade                                |
| SendGrid (Essentials → Pro)     | $20             | $90             | Dedicated IP required (compliance/reputation) or >50k emails/month  |
| **TOTAL**                       | **~$173/month** | **~$592/month** |                                                                     |

> 🎯 **Realistic mid-range estimate: ~$250 – $380/month**

### Key Cost Drivers

1. **Zoom** — widest range; driven entirely by the number of broker licenses needed
2. **Vercel** — scales with API call volume and CPU time per function
3. **Ably** — scales linearly with total connected hours per day
4. **TiDB** — scales with query complexity and RU consumption per request

---

## Optimization Recommendations

### 🔴 Priority 1 — High Impact

- [ ] Add `Cache-Control` headers to read-heavy API endpoints (`/loans`, `/tasks`, `/documents`) to reduce Vercel invocations by 40–60% and batch Ably publish events.
- [ ] Implement server-side result caching (Vercel KV or in-memory) for rarely-changed data (broker list, task templates, tenant config) — reduces TiDB RU consumption significantly.
- [ ] Switch to **Ably MAU billing** if users are active fewer than ~20 days/month — can reduce cost vs pay-per-minute.

### 🟡 Priority 2 — Medium Impact

- [ ] Use **Zoom annual billing** (vs monthly) to save ~17% on broker licenses.
- [ ] Migrate CDN from `disruptinglabs.com` to **Vercel Blob** (already included in Pro plan) to eliminate custom CDN dependency.
- [ ] Confirm SendGrid API keys are wired into `SMTP_HOST` / `SMTP_USER` in `.env` — both Hostgator SMTP accounts (`disruptinglabs.com` + `garbrix.com`) can be consolidated into the single SendGrid Essentials account.

### 🟢 Priority 3 — Future Consideration

- [ ] If TiDB costs consistently exceed $100/month, evaluate **TiDB Cloud Essential** for dedicated compute with predictable pricing (~$600/month).
- [ ] Monitor Vercel function execution time — optimize slow endpoints (bulk queries, PDF generation) to reduce Active CPU charges.

---

## Not Included in This Audit

| Item                          | Notes                                    |
| ----------------------------- | ---------------------------------------- |
| Twilio (SMS + voice)          | Excluded per request                     |
| Domain (`encoremortgage.org`) | ~$15–20/year, assumed separately managed |
| SSL/TLS certificates          | Included with Vercel — free              |
| AI/LLM APIs                   | None detected in codebase                |

---

---

## ✅ Conclusion

### Total Monthly Cost at 500 Concurrent Users

| Service                         | Low          | Mid-Range    | High         |
| ------------------------------- | ------------ | ------------ | ------------ |
| Vercel (Pro + usage)            | $50          | $65          | $80          |
| Ably (Standard + usage)         | $52          | $63          | $75          |
| Zoom (Pro, broker licenses)     | $16          | $133         | $267         |
| TiDB Cloud (Serverless + usage) | $25          | $38          | $50          |
| disruptinglabs CDN              | $10          | $20          | $30          |
| SendGrid (Essentials → Pro)     | $20          | $20          | $90          |
| **TOTAL**                       | **~$173/mo** | **~$339/mo** | **~$592/mo** |

> 🎯 **Realistic monthly spend: ~$260 – $400/month**  
> 💡 After applying caching, Zoom annual billing, and CDN migration: **~$190 – $300/month**

### What Drives the Range

- **Low end (~$173):** Minimal Zoom usage (1 API license), users active for short sessions, free TiDB quota not exceeded, SendGrid Essentials.
- **Mid-range (~$339):** 10 broker Zoom licenses, typical 8-hr workday sessions, moderate DB query load, SendGrid Essentials.
- **High end (~$592):** 20 broker Zoom licenses, heavy API usage, complex DB queries, SendGrid Pro with dedicated IP.

---

_Pricing sourced from: [vercel.com/pricing](https://vercel.com/pricing) · [ably.com/pricing](https://ably.com/pricing) · [pingcap.com/tidb-cloud-pricing](https://www.pingcap.com/tidb-cloud-pricing/) · [zoom.com/pricing](https://zoom.com/pricing) · Last updated: April 9, 2026_
