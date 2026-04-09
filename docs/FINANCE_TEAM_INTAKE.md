# Monthly Operating Costs — Finance Team Intake

**Encore Mortgage CRM Platform** · April 2026

---

We are finalizing the monthly infrastructure budget for the CRM platform. To move forward, we need your team to review and confirm the following costs and approve a recurring monthly budget.

---

## What We Need You to Confirm

### 1. Approved Monthly Budget Range

Based on our technical audit, the platform requires the following monthly spend to operate at **500 concurrent users**:

| Scenario                                  | Monthly Cost |
| ----------------------------------------- | ------------ |
| Minimum (small broker team, ~1–2 brokers) | ~$173/month  |
| Realistic (10 brokers with Zoom licenses) | ~$339/month  |
| Full team (20 brokers with Zoom licenses) | ~$592/month  |

**Question for finance team:**

> What is the approved monthly infrastructure budget for the CRM platform?

---

### 2. Number of Brokers Using the Platform

Zoom video meeting licenses are priced **per broker** hosting meetings. Clients always join for free.

| Brokers            | Monthly Zoom Cost |
| ------------------ | ----------------- |
| 1 (shared account) | ~$16              |
| 10 brokers         | ~$133             |
| 20 brokers         | ~$267             |

**Question for finance team:**

> How many brokers will actively use the platform and need individual Zoom meeting licenses?

---

### 3. Billing Cycle Preference

Most services offer a discount for annual billing (up to 17% on Zoom).

**Question for finance team:**

> Do you prefer **monthly billing** (flexible, no commitment) or **annual billing** (lower cost, upfront commitment)?

---

### 4. Payment Method on File

Each vendor requires a credit card or bank account on file:

- Vercel (hosting)
- Ably (real-time)
- Zoom (video)
- TiDB Cloud (database)
- SendGrid (email)

**Question for finance team:**

> Who will be the billing owner for these vendor accounts — IT, operations, or a dedicated card?

---

### 5. Email Volume Estimate

SendGrid is used to send all platform emails: loan update notifications, document requests, appointment invitations, and reminder messages.

| Plan               | Monthly Cost | Max Emails     |
| ------------------ | ------------ | -------------- |
| Essentials         | $19.95       | 50,000 emails  |
| Pro (dedicated IP) | $89.95       | 100,000 emails |

**Question for finance team:**

> Approximately how many client-facing emails do you expect to send per month?

---

## Summary of Vendors to Approve

| Vendor             | Purpose                    | Est. Monthly Cost      |
| ------------------ | -------------------------- | ---------------------- |
| Vercel             | Platform hosting           | $50 – $80              |
| Ably               | Real-time notifications    | $52 – $75              |
| Zoom               | Video meetings for brokers | $16 – $267             |
| TiDB Cloud         | Database                   | $25 – $50              |
| SendGrid           | Transactional email        | $20 – $90              |
| disruptinglabs CDN | Image/document storage     | $10 – $30              |
| **Total**          |                            | **~$173 – $592/month** |

---

## Next Steps

Please respond to each question above so we can:

1. Lock in the correct plan tiers for each vendor
2. Set up billing accounts under the approved payment method
3. Confirm go-live budget before launch

---

_Prepared by the technical team · Questions? Contact the project lead._
