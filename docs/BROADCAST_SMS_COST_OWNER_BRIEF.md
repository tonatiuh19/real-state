# Why Broadcast SMS Costs What It Costs — Twilio Documentation Brief

**Audience:** Platform owner  
**Purpose:** Explain blast cost using **Twilio’s own documentation and pricing pages** (primary). Comparisons to GHL / prior tools are secondary.  
**Related:** `docs/BILLING_AND_QUOTA_PLAN.md` · `docs/TWILIO_BULK_MESSAGING_BROADCAST_PROPOSAL.md`

> **Important:** Twilio prices can change. Always confirm live numbers on Twilio’s pricing page before quoting an invoice. Pricing snapshot below reflects Twilio’s published US rates (page marked as of **3/2/26**).

---

## 1. One-sentence answer (backed by Twilio)

**Twilio bills SMS by message *segment*, and U.S. carriers add extra fees per segment.**  
A Broadcast to 1,400 people is **1,400+ billable segments**, not one charge — because that is how Twilio (and the carriers) price delivery.

---

## 2. Official Twilio sources (share these links)

| Topic | Twilio document | URL |
|-------|-----------------|-----|
| **US SMS / MMS list prices + carrier fees** | SMS Pricing — United States | https://www.twilio.com/en-us/sms/pricing/usa |
| **What a “segment” is + character limits** | How long can a message be? | https://www.twilio.com/docs/glossary/what-sms-character-limit |
| **Segment primer (Twilio Help)** | What the Heck is a Segment? | https://www.twilio.com/blog/what-the-heck-is-a-segment |
| **Segment calculator (before you send)** | Message Segment Calculator | https://twiliodeved.github.io/message-segment-calculator/ |
| **Cost model overview** | SMS Foundations — understanding message costs | https://www.twilio.com/docs/messaging/onboarding/sms-foundations |
| **SMS charged per segment (error docs)** | Error 30010 notes pricing is per-segment | https://www.twilio.com/docs/api/errors/30010 |
| **A2P 10DLC registration fees** | A2P 10DLC pricing & fees | https://help.twilio.com/articles/1260803965530-What-pricing-and-fees-are-associated-with-the-A2P-10DLC-service- |
| **Bulk Messaging (ops API, not a discount)** | Bulk Messaging overview | https://www.twilio.com/docs/bulk-messaging/overview |
| **Bulk getting started** | Getting started with Bulk Messaging | https://www.twilio.com/docs/bulk-messaging/getting-started |
| **Downloadable price CSV** | From US pricing page | https://www.twilio.com/en-us/sms/pricing/usa |

---

## 3. What Twilio says (quoted / paraphrased from Twilio docs)

### 3.1 You pay per **segment**, not per “Send” click

From Twilio’s glossary ([How long can a message be?](https://www.twilio.com/docs/glossary/what-sms-character-limit)):

> **“Twilio bills SMS per message segment sent.”**

From the same page:

- GSM-7 (plain Latin text): **160** characters = 1 segment; longer messages split (about **153** chars per follow-on segment).
- UCS-2 (emoji / curly quotes / many special characters): **70** characters = 1 segment; longer ≈ **67** chars per follow-on segment.
- Example Twilio gives: a **161-character** GSM-7 message is sent as **two segments**.

From Twilio US pricing footnotes ([SMS Pricing USA](https://www.twilio.com/en-us/sms/pricing/usa)):

> **“Text messages are charged per segment.”**  
> **“Additional carrier fees may apply.”**

### 3.2 US list prices (Twilio published)

From [Twilio SMS Pricing — United States](https://www.twilio.com/en-us/sms/pricing/usa) (long code / toll-free / short code SMS):

| Direction | Twilio base (USD) |
|-----------|-------------------|
| SMS Outbound | **$0.0083** per segment |
| SMS Inbound | **$0.0083** per segment |
| MMS Outbound | **$0.022** |
| MMS Inbound | **$0.0165** (long code) |

Twilio also states pricing starts at **$0.0083** and that **carrier fees and destination rates apply**.

### 3.3 Carrier fees are **extra** (Twilio publishes them)

Same pricing page — **Long code SMS Outbound** carrier fees (per segment):

| Carrier | SMS Outbound fee (USD) |
|---------|-------------------------|
| AT&T | **$0.0035** |
| T-Mobile | **$0.0045** |
| Verizon | **$0.0045** |
| US Cellular | **$0.005** |
| All other carriers | **$0.004** |

**All-in example (Twilio math, not ours):**

```text
One short outbound SMS to an AT&T user
≈ $0.0083 (Twilio) + $0.0035 (AT&T) = ~$0.0118 per segment
```

That matches Twilio’s own model in [SMS Foundations](https://www.twilio.com/docs/messaging/onboarding/sms-foundations):

> Typical cost = **phone number (monthly)** + **price of each message segment** + **any applicable carrier fees**.

### 3.4 Phone numbers also cost money (Twilio)

From the same US pricing page:

| Number type | Twilio leased / month |
|-------------|------------------------|
| Long code | **$1.15** |
| Toll-free | **$2.15** |

### 3.5 Failed messages can still cost something

Twilio US pricing footnote:

> A **failed message processing fee of $0.001** per message applies to messages that terminate in a **Failed** status.

### 3.6 Bulk Messaging is **not** a cheaper SMS product

From [Bulk Messaging overview](https://www.twilio.com/docs/bulk-messaging/overview):

- Send to up to **10,000** recipients in **one API request**
- **“Your existing messages per second (MPS) limits still apply.”**

Twilio documents Bulk as a **delivery / API efficiency** feature (less load, Operations tracking).  
Twilio does **not** publish a separate “Bulk SMS $0.00x cheaper than Messages API” price list.  
**US SMS pricing remains the segment + carrier fee table** on the pricing page.

---

## 4. Owner math using Twilio’s numbers

Use Twilio’s Segment Calculator before large blasts:  
https://twiliodeved.github.io/message-segment-calculator/

| Blast | Segments each (Twilio rules) | Total segments | Est. Twilio+carrier (~$0.012 all-in)* |
|-------|------------------------------|----------------|----------------------------------------|
| 1,431 people × short plain SMS | 1 | 1,431 | ~**$17** |
| 1,431 × longer body (2 segments) | 2 | 2,862 | ~**$34** |
| 1,431 × emoji / long UCS-2 | 3–4 | ~4.3k–5.7k | ~**$52–$68** |

\*Our Billing planning rate **$0.012 / segment** (`cogsSmsPerSegmentUsd`) is an **all-in COGS estimate** (~Twilio $0.0083 + typical carrier fee). Final Twilio invoice follows Twilio’s live rates and the recipient’s carrier.

---

## 5. Why GHL / prior tools can *feel* cheaper (still Twilio underneath)

Many platforms (including GHL LC Phone) bill **credits** while still using **Twilio’s segment + carrier fee model**.  
That does not change Twilio’s published rates — it only changes how the bill is labeled.

Primary proof remains Twilio docs above. GHL’s own help also points people to the same segment/carrier math (secondary).

---

## 6. Talking points for the platform owner (Twilio-first)

1. **Open Twilio’s US pricing page** — SMS is **$0.0083/segment** + **carrier fees** listed by AT&T / T-Mobile / Verizon.  
   → https://www.twilio.com/en-us/sms/pricing/usa  

2. **Open Twilio’s segment glossary** — Twilio **bills per segment**; emoji can cut you from 160 → 70 chars.  
   → https://www.twilio.com/docs/glossary/what-sms-character-limit  

3. **Paste the blast text into Twilio’s Segment Calculator** before sending.  
   → https://twiliodeved.github.io/message-segment-calculator/  

4. **Bulk Messaging** (if we enable it) reduces **API/ops load**, not Twilio’s **$/segment** — Twilio still applies MPS limits.  
   → https://www.twilio.com/docs/bulk-messaging/overview  

5. **To lower the Twilio bill:** fewer recipients, fewer segments (shorter text, no emoji), no MMS images.

---

## 7. What this platform controls vs what Twilio controls

| Controlled by Twilio / carriers | Controlled by this platform |
|---------------------------------|-----------------------------|
| $/segment list price | How we **show** usage (SMS segments in Billing) |
| Carrier surcharges | Audience filters, STOP, draft length warnings |
| A2P registration fees | Monthly platform fee (software — not unlimited SMS) |
| Segment encoding rules | Whether Bulk API is used for large sends (ops only) |

---

## 8. Checklist before a large Broadcast (Twilio-aligned)

- [ ] Draft SMS → run [Twilio Segment Calculator](https://twiliodeved.github.io/message-segment-calculator/)
- [ ] Prefer **1 segment**, GSM-7 (no emoji / curly quotes)
- [ ] Estimate: `recipients × segments × (~$0.0083 + ~$0.0035–$0.005 carrier)`
- [ ] Confirm remaining SMS quota in `/admin/billing`
- [ ] Remember: Twilio Bulk (if on) does **not** change this math

---

*Document maintained for owner conversations. Always re-check [Twilio SMS Pricing USA](https://www.twilio.com/en-us/sms/pricing/usa) for current rates.*
