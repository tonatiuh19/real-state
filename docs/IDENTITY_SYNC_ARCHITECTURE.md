# Contact Identity & Sync Architecture — Full Proposal

> **Status**: Pre-implementation design document.  
> **Scope**: Full architectural audit + proposed target state.  
> **Do not implement** without team review and phased migration plan.

---

## 1. Executive Summary

The platform currently suffers from distributed, non-deterministic identity resolution that allows the same real-world person to exist as multiple client records sharing the same phone or email, creating conversation thread fragmentation, "Unknown Client" appearances, ownership inconsistencies, and sync-induced duplicates.

The root cause is not any single bug — it is a missing **Identity Layer**. Identity resolution is scattered across seven separate code paths, each independently querying with `LIMIT 1` and no stable ordering, producing different results for the same input depending on which code path is hit first.

This document proposes a canonical entity model, a centralized Identity Resolution Engine, an Ownership Engine, a Sync Guard layer, and a normalized event pipeline that prevents these failures at the architectural level.

---

## 2. Current State Audit

### 2.1 Anti-Patterns Found

| #   | Anti-Pattern                                                   | Location                                                                                                                                                    | Impact                                                                                                   |
| --- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| A1  | Phone stored as `varchar(20)` with no normalization constraint | `clients.phone`                                                                                                                                             | Same number stored as `9095279692`, `+19095279692`, `(909) 527-9692` — treated as 3 different identities |
| A2  | No UNIQUE constraint on `clients(tenant_id, normalized_phone)` | `clients` DDL                                                                                                                                               | Multiple clients with same phone (confirmed: 3 clients for `9095279692`)                                 |
| A3  | `LIMIT 1` without `ORDER BY` on phone/email lookups            | `upsertConversationThread`, `handleSendMessage`, `handleInboundSMS`                                                                                         | Non-deterministic identity resolution — different calls for same phone return different clients          |
| A4  | `conversation_id` semantically encodes identity                | `conv_client_*`, `conv_phone_*`, `conv_unknown_*`                                                                                                           | Same phone has 5+ parallel threads; impossible to canonicalize without data migration                    |
| A5  | Ownership inferred, never explicit                             | `broker_id` on threads set via COALESCE chain                                                                                                               | Silent re-assignment when client moves broker; lost ownership on reconnect                               |
| A6  | No external provider ID → canonical person mapping table       | No `channel_identities` table                                                                                                                               | Provider reconnect re-creates identities; WhatsApp/Instagram numbers not mappable                        |
| A7  | Identity resolution duplicated in 7+ code paths                | `upsertConversationThread`, `upsertEmailThread`, `handleSendMessage`, `handleInboundSMS`, `handleVoiceIncoming`, `handleCreateClient`, `handleUpdateClient` | Each path can diverge; no single source of truth                                                         |
| A8  | No idempotency on inbound SMS/voice webhooks                   | `handleInboundSMS`, `handleVoiceIncoming`                                                                                                                   | Twilio webhook retries create duplicate threads/communications                                           |
| A9  | Synchronous webhook processing                                 | All Twilio/Graph webhooks processed inline                                                                                                                  | Race conditions; single slow DB write blocks webhook response; Twilio 15s timeout risk                   |
| A10 | Calendar events have no external provider ID                   | `calendar_events` DDL                                                                                                                                       | Office 365 Calendar reconnect creates duplicate birthday/anniversary events                              |
| A11 | Three separate identity tables with no union model             | `clients`, `leads`, `brokers`                                                                                                                               | Person can be "lead" in one context, "client" in another, with divergent phone/email                     |

### 2.2 Confirmed Data Problems (from live DB query)

```
Phone 9095279692 exists in 3 client records:
  id=750015  Hebert Medina  assigned_broker_id=NULL  → active SMS thread conv_client_750015
  id=180015  Avila Test     assigned_broker_id=3     → active call thread conv_client_180015
  id=270015  Hebert Test    assigned_broker_id=3     → closed SMS thread conv_client_270015

Parallel threads for same phone:
  conv_client_180015       — call,  active,  Avila Test
  conv_client_750015       — sms,   active,  Hebert Medina
  conv_phone_19095279692   — call,  active,  Avila Test  (duplicate of above)
  conv_client_270015       — sms,   closed,  Hebert Test
  conv_1778791907583_*     — sms,   closed,  Avila Test
  conv_1778791534595_*     — sms,   closed,  Avila Test
  conv_1778791390862_*     — sms,   closed,  Avila Test

Result: 7 threads for one phone number; inbound SMS routes randomly
```

### 2.3 How Industry Platforms Solve This

| Platform       | Approach                                                                                                                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HubSpot**    | Canonical Contact record with `hs_object_id`; deduplication engine runs on email as primary key; all channel identities (phone, WhatsApp, live chat) stored as properties on the Contact; manual merge queue for conflicts |
| **Salesforce** | Person Account or Contact as master record; `DuplicateRule` + `MatchingRule` run on create/update; `ExternalId__c` field on every sync'd object; conflict goes to Data Quality queue                                       |
| **Intercom**   | User identity pinned to `user_id` (immutable external key) OR email as fallback; all conversation participants linked to the canonical User; "leads" promoted to "users" on login                                          |
| **Front**      | Contact uniquely identified by any channel handle (email, phone, WhatsApp number); conversation always belongs to exactly one contact; contact merge is always manual with full audit trail                                |
| **Slack**      | Workspace member = canonical identity; external identities (email, SAML) mapped to workspace member; reconnect always resolves to existing member by email                                                                 |

**Common patterns across all five**:

1. One immutable canonical ID per person
2. Channel identities (phone, email, WhatsApp) stored separately and linked to canonical ID
3. Deduplication is rule-based, not opportunistic
4. Merge is always manual-approved (never auto-merged on a single signal)
5. External provider IDs are immutable and indexed
6. Ownership is explicit, never inferred

---

## 3. Proposed Architecture

### 3.1 Core Principles

1. **Three canonical contact types exist** — `clients` (mortgage borrowers), `leads` (pre-qualification pipeline), and partner realtors stored as `brokers` (role='broker'). No new `persons` table. Each is already the correct entity for its domain.
2. **Channel identities are separate satellite entities** — `channel_identities` links phone/email/WhatsApp handles to whichever entity owns them (`client_id`, `lead_id`, or `broker_id`).
3. **Ownership is always explicit** — written at assignment time, never inferred at read time.
4. **External IDs are immutable** — provider reconnect resolves to existing record.
5. **Identity resolution is centralized** — single `resolveIdentity()` function, zero duplicates. Returns `{entityType, entityId}` for the matched `client`, `lead`, or `broker`.
6. **Sync operations are idempotent** — same external event processed multiple times = same result.
7. **No auto-merge** — duplicates go to a merge queue; a human approves.
8. **`contact_broker_id` is distinct from `broker_id`** — `broker_id` = which CRM mortgage banker owns the thread; `contact_broker_id` = the partner realtor IS the external contact being communicated with. These are fundamentally different roles.

---

### 3.2 Canonical Entity Model

> **Critical constraint**: No new `persons` table is introduced. The existing `clients`, `leads`, and `brokers` tables are the canonical identity anchors. This avoids rewriting every FK in 20+ tables and preserves all mortgage-specific fields (`income_type NOT NULL`, `ssn_encrypted`, `credit_score`, `citizenship_status`, `password_hash` for client portal, etc.).

**Three contact types and their roles:**

| Table                     | Who they are                                       | Portal access                     | Key constraint                                                 |
| ------------------------- | -------------------------------------------------- | --------------------------------- | -------------------------------------------------------------- |
| `clients`                 | Mortgage borrowers                                 | Yes — `password_hash` + OTP login | `income_type NOT NULL`; `(tenant_id, email)` UNIQUE            |
| `leads`                   | Pre-qualification pipeline; not yet a client       | No                                | `email NOT NULL`; `converted_to_client_id` tracks promotion    |
| `brokers` (role='broker') | Partner realtors (external contacts, no CRM login) | No                                | `created_by_broker_id` tracks which admin imported them        |
| `brokers` (role='admin')  | Internal mortgage bankers using the CRM            | Yes                               | `twilio_caller_id`, `twilio_phone_sid` for their personal line |

**Two-column distinction on `conversation_threads`:**

- `broker_id` — which internal CRM mortgage banker **handles** this thread (the CRM user)
- `contact_broker_id` — the partner realtor **IS** the contact being communicated with (used when `client_id = NULL` and the other party is a realtor)

These are mutually exclusive relationship roles and must never be confused.

```
┌────────────────────────────┐   ┌─────────────────────────────┐
│         clients            │   │           leads              │
│  (mortgage borrowers)      │   │  (pre-qualification)         │
│  id, tenant_id             │   │  id, tenant_id               │
│  income_type NOT NULL       │   │  email NOT NULL              │
│  ssn_encrypted             │   │  status (new/contacted/...)  │
│  credit_score              │   │  converted_to_client_id FK   │
│  citizenship_status        │   │  source, interest_type       │
│  password_hash (portal)    │   │  assigned_broker_id          │
│  assigned_broker_id        │   └──────────────┬──────────────┘
│  normalized_phone          │                  │
└────────────┬───────────────┘                  │
             │                                  │
             └──────────────┬───────────────────┘
                            │ (3-way union via nullable FKs)
                            ▼
       ┌──────────────────────────────────────────┐
       │           channel_identities              │
       │  id (PK)                                  │
       │  tenant_id                                │
       │  client_id INT DEFAULT NULL (FK→clients)  │
       │  lead_id   INT DEFAULT NULL (FK→leads)    │
       │  broker_id INT DEFAULT NULL (FK→brokers)  │
       │    CHECK: exactly one of the above is set │
       │  channel ENUM('phone','email',            │
       │    'whatsapp','instagram','facebook')      │
       │  handle varchar(255)                      │
       │  normalized_handle varchar(255)           │
       │  is_primary TINYINT(1)                    │
       │  verified TINYINT(1)                      │
       │  source ENUM('manual','import',           │
       │    'inbound','provider_sync')             │
       │  created_at                               │
       │  UNIQUE(tenant_id, channel,               │
       │    normalized_handle)                     │
       └──────────────────────────────────────────┘

       ┌──────────────────────────────────────────┐
       │           provider_mappings               │
       │  id (PK)                                  │
       │  tenant_id                                │
       │  client_id INT DEFAULT NULL (FK→clients)  │
       │  lead_id   INT DEFAULT NULL (FK→leads)    │
       │  broker_id INT DEFAULT NULL (FK→brokers)  │
       │    CHECK: exactly one of the above is set │
       │  provider ENUM('twilio','office365',       │
       │    'google','whatsapp','instagram')        │
       │  provider_account_id VARCHAR(255)         │
       │  provider_contact_id VARCHAR(255) -- immut│
       │  raw_metadata JSON                        │
       │  created_at                               │
       │  UNIQUE(tenant_id, provider,              │
       │    provider_account_id, provider_contact_id)│
       └──────────────────────────────────────────┘
```

**`conversation_threads` additions** (no columns removed — additive only):

```
  owner_broker_id INT — explicit owning CRM broker (backfilled from broker_id COALESCE)
  -- broker_id kept for backward compat, deprecated after migration
  -- contact_broker_id already exists (partner realtor IS the contact)
  -- client_id / lead_id already exist as nullable FKs
```

```
┌──────────────────────────────────────────────────────┐
│               sync_events                             │
│  id (PK)                                             │
│  tenant_id (FK)                                      │
│  idempotency_key varchar(255) UNIQUE                 │
│  provider ENUM('twilio','office365','google',...)    │
│  event_type varchar(100)                             │
│  raw_payload JSON                                    │
│  normalized_payload JSON                             │
│  status ENUM('pending','processing','done','failed') │
│  entity_type ENUM('client','lead','broker') DEFAULT NULL │
│  entity_id INT DEFAULT NULL (set after resolution)      │
│  error_detail TEXT                                   │
│  attempts INT DEFAULT 0                              │
│  processed_at datetime                               │
│  created_at                                          │
│  INDEX(idempotency_key)                              │
│  INDEX(status, created_at)                           │
└──────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────┐
│               merge_candidates                        │
│  id (PK)                                             │
│  tenant_id (FK)                                      │
│  client_id_a (FK → clients)                          │
│  client_id_b (FK → clients)                          │
│  confidence DECIMAL(5,2) — 0.00–100.00              │
│  signals JSON — {"phone": true, "email": false, ...} │
│  status ENUM('pending','approved','rejected',        │
│    'auto_merged')                                    │
│  reviewed_by (FK → brokers, nullable)                │
│  created_at, reviewed_at                             │
│  UNIQUE(tenant_id, client_id_a, client_id_b)        │
└──────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────┐
│               conversation_ownership_log              │
│  id (PK)                                             │
│  tenant_id (FK)                                      │
│  conversation_id varchar(100)                        │
│  broker_id (FK → brokers)                            │
│  action ENUM('assigned','claimed','transferred',     │
│    'auto_assigned')                                  │
│  reason varchar(255)                                 │
│  created_at                                          │
└──────────────────────────────────────────────────────┘
```

---

### 3.3 Identity Resolution Engine

A single centralized function `resolveIdentity()` replaces all 7 scattered lookup patterns:

```typescript
interface IdentitySignals {
  tenantId: number;
  phone?: string | null; // raw, any format
  email?: string | null;
  providerName?: string; // 'twilio' | 'office365' | 'google' ...
  providerContactId?: string; // immutable ID from provider
  providerAccountId?: string; // mailbox/account this came from
  displayName?: string | null; // from provider, used only for new records
  brokerContextId?: number | null; // requesting broker (for tie-breaking)
  // true → look in brokers table first (partner realtor context)
  isRealtorContext?: boolean;
}

interface IdentityResult {
  entityType: "client" | "lead" | "broker";
  entityId: number;
  isNew: boolean;
  hadConflict: boolean; // true if multiple candidates found
  conflictIds?: Array<{ entityType: string; entityId: number }>;
}

async function resolveIdentity(
  signals: IdentitySignals,
): Promise<IdentityResult>;
```

**Resolution order (strict precedence)**:

```
1. Provider ID lookup (immutable, highest confidence)
   SELECT entity_type, entity_id FROM provider_mappings
   WHERE tenant_id=? AND provider=? AND provider_account_id=?
     AND provider_contact_id=?
   → If found: return immediately (zero ambiguity)

2. Email lookup across clients, leads, brokers (in that priority order)
   SELECT 'client' as t, id FROM clients
     WHERE tenant_id=? AND email = LOWER(TRIM(?))
   UNION
   SELECT 'lead', id FROM leads
     WHERE tenant_id=? AND email = LOWER(TRIM(?))
   UNION
   SELECT 'broker', id FROM brokers
     WHERE tenant_id=? AND email = LOWER(TRIM(?))
   → clients win over leads win over brokers (mortgage context)
   → If isRealtorContext=true: brokers searched first
   → If exactly 1: return it
   → If 0: continue to phone

3. Phone lookup (may have multiple — conflict path)
   Normalize: last_10 = RIGHT(REGEXP_REPLACE(raw,'[^0-9]',''), 10)
   SELECT 'client' as t, id FROM clients
     WHERE tenant_id=? AND normalized_phone = last_10
   UNION
   SELECT 'lead', id FROM leads
     WHERE tenant_id=? AND RIGHT(REGEXP_REPLACE(phone,'[^0-9]',''),10) = last_10
   UNION
   SELECT 'broker', id FROM brokers
     WHERE tenant_id=? AND RIGHT(REGEXP_REPLACE(phone,'[^0-9]',''),10) = last_10
   → If exactly 1 across all: return it
   → If >1: enqueue merge_candidates, return the one with
            most recent interaction OR assigned to brokerContextId
   → If 0: create new lead (step 4)

4. Create new lead (unknown contact → always a lead first)
   INSERT INTO leads (
     tenant_id, source='other', first_name, last_name,
     email = email ?? 'noemail_{normalized_phone}@noemail.placeholder',
     phone, interest_type='other', status='new',
     assigned_broker_id = brokerContextId
   )
   INSERT INTO channel_identities (lead_id, channel, handle, ...)
   INSERT INTO provider_mappings (lead_id, ...) if provider signals present
   → Unknown callers become leads, not a generic 'prospect' type
   → Broker can promote to client via existing handleCreateClient flow
```

**Key invariants**:

- `resolveIdentity()` is the ONLY function that creates new contact records
- All 7 current call sites replaced by a single call to `resolveIdentity()`
- Returns `{entityType, entityId}` — caller must use the right table
- `leads.email NOT NULL` → placeholder email for phone-only unknown callers (pattern already used in the system: `noemail_*@imported.local`)
- All DB operations inside a transaction

---

### 3.4 Ownership Engine

Ownership is always **explicit** and **logged**:

```typescript
interface OwnershipDecision {
  conversationId: string;
  entityType: "client" | "lead" | "broker"; // from resolveIdentity()
  entityId: number;
  tenantId: number;
  inboxNumber?: string; // Twilio number that received the message
  requestingBrokerId?: number; // broker who sent (for outbound)
}

async function assignOwnership(
  decision: OwnershipDecision,
): Promise<number | null /*brokerId*/> {
  // Priority (strict):
  // 1. If inboxNumber matches a broker's personal twilio_caller_id → that broker
  // 2. If entityType='client' and client.assigned_broker_id is set → that broker
  //    If entityType='lead' and lead.assigned_broker_id is set → that broker
  //    If entityType='broker' (partner realtor contact):
  //      → contact_broker_id = entityId; broker_id = requestingBrokerId
  // 3. If requestingBrokerId sent outbound → that broker
  // 4. If existing thread already has an owner → keep it (no silent reassignment)
  // 5. Shared inbox (broker_id = NULL, visible to all admins)
  // Always writes to conversation_ownership_log
  // Never silently overwrites existing non-null owner
}
```

Rules:

- `owner_broker_id` on `conversation_threads` is **write-once** at creation (in normal flow)
- Changing ownership requires an explicit `transferConversation()` call
- `transferConversation()` writes to `conversation_ownership_log` with reason
- No background job silently re-assigns ownership

---

### 3.5 Sync Guard Layer

Every inbound provider event passes through the **Sync Guard** before any DB write:

```
Inbound event (Twilio webhook / Graph notification / etc.)
       │
       ▼
┌──────────────────────────────────────────────┐
│  SYNC GUARD                                  │
│                                              │
│  1. Verify provider signature                │
│  2. Compute idempotency_key                  │
│     = SHA256(provider + account_id +         │
│              event_type + provider_event_id) │
│  3. INSERT INTO sync_events                  │
│     (idempotency_key, status='pending')      │
│     ON DUPLICATE KEY → return 200 (already   │
│     seen, skip processing)                   │
│  4. Normalize payload to canonical format    │
│  5. Enqueue to processing pipeline           │
│  6. Return 200 to provider immediately        │
└──────────────────────────────────────────────┘
       │
       ▼ (async, from queue)
┌──────────────────────────────────────────────┐
│  EVENT PROCESSOR                             │
│                                              │
│  1. resolveIdentity(signals from event)      │
│  2. assignOwnership(...)                     │
│  3. upsertConversationThread(...)            │
│  4. insertCommunication(...)                 │
│  5. publishAbly(...)                         │
│  6. UPDATE sync_events SET status='done'     │
└──────────────────────────────────────────────┘
```

**Idempotency key construction per provider**:

| Provider         | Key Components                               |
| ---------------- | -------------------------------------------- |
| Twilio SMS       | `twilio + AccountSid + MessageSid`           |
| Twilio Voice     | `twilio + AccountSid + CallSid + CallStatus` |
| Twilio WhatsApp  | `twilio_wa + AccountSid + MessageSid`        |
| Office 365 email | `o365 + mailboxId + internetMessageId`       |
| Google Calendar  | `gcal + calendarId + eventId + updatedAt`    |
| Instagram DM     | `instagram + accountId + messageId`          |

---

### 3.6 Normalized Provider Event Pipeline

All providers emit different formats. A **Provider Adapter** normalizes each into:

```typescript
interface NormalizedEvent {
  idempotencyKey: string;
  provider: "twilio" | "office365" | "google" | "whatsapp" | "instagram";
  providerAccountId: string; // mailbox ID, Twilio account SID, etc.
  providerEventId: string; // immutable provider-assigned ID
  eventType:
    | "message_inbound"
    | "message_outbound"
    | "call_inbound"
    | "call_outbound"
    | "calendar_event_upsert"
    | "contact_sync";
  direction: "inbound" | "outbound";
  channel: "sms" | "whatsapp" | "email" | "voice" | "instagram" | "facebook";
  from: {
    handle: string; // raw phone/email/username
    normalizedHandle: string; // last-10 digits OR lowercase email OR @handle
    displayName?: string;
    providerContactId?: string; // provider's ID for this contact
  };
  to: {
    handle: string;
    normalizedHandle: string;
  };
  body?: string;
  subject?: string;
  mediaUrls?: string[];
  timestamp: Date;
  rawPayload: unknown;
}
```

Each provider adapter implements:

```typescript
interface ProviderAdapter {
  provider: string;
  verifySignature(req: Request): boolean;
  normalize(rawPayload: unknown, accountId: string): NormalizedEvent;
  sendMessage(
    to: string,
    body: string,
    options?: SendOptions,
  ): Promise<SendResult>;
}
```

Concrete adapters:

- `TwilioSMSAdapter`
- `TwilioVoiceAdapter`
- `TwilioWhatsAppAdapter`
- `Office365EmailAdapter`
- `GoogleCalendarAdapter` (future)
- `InstagramAdapter` (future)

---

### 3.7 Database Schema Recommendations

#### New tables needed

> **No `persons` table.** The existing `clients`, `leads`, and `brokers` tables remain the canonical entities. New tables are purely additive satellites.

```sql
-- Channel handles for any contact type (client, lead, or partner realtor broker)
-- Exactly one of client_id / lead_id / broker_id must be non-NULL per row
CREATE TABLE channel_identities (
  id                INT NOT NULL AUTO_INCREMENT,
  tenant_id         INT NOT NULL,
  client_id         INT DEFAULT NULL,   -- FK → clients(id)
  lead_id           INT DEFAULT NULL,   -- FK → leads(id)
  broker_id         INT DEFAULT NULL,   -- FK → brokers(id) — partner realtors only
  channel           ENUM('phone','email','whatsapp','instagram','facebook') NOT NULL,
  handle            VARCHAR(255) NOT NULL,      -- raw value as provided
  normalized_handle VARCHAR(255) NOT NULL,      -- canonical form used for lookup
  is_primary        TINYINT(1) NOT NULL DEFAULT 0,
  verified          TINYINT(1) NOT NULL DEFAULT 0,
  source            ENUM('manual','import','inbound','provider_sync') NOT NULL DEFAULT 'manual',
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_channel_identity (tenant_id, channel, normalized_handle),
  KEY idx_ci_client (tenant_id, client_id),
  KEY idx_ci_lead (tenant_id, lead_id),
  KEY idx_ci_broker (tenant_id, broker_id),
  CONSTRAINT chk_ci_one_owner CHECK (
    (client_id IS NOT NULL) + (lead_id IS NOT NULL) + (broker_id IS NOT NULL) = 1
  ),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (broker_id) REFERENCES brokers(id) ON DELETE CASCADE
);

-- Immutable external provider → contact mapping
-- Exactly one of client_id / lead_id / broker_id must be non-NULL per row
CREATE TABLE provider_mappings (
  id                   INT NOT NULL AUTO_INCREMENT,
  tenant_id            INT NOT NULL,
  client_id            INT DEFAULT NULL,  -- FK → clients(id)
  lead_id              INT DEFAULT NULL,  -- FK → leads(id)
  broker_id            INT DEFAULT NULL,  -- FK → brokers(id) — partner realtors
  provider             ENUM('twilio','office365','google','whatsapp','instagram','facebook') NOT NULL,
  provider_account_id  VARCHAR(255) NOT NULL,  -- our mailbox/account identifier
  provider_contact_id  VARCHAR(255) NOT NULL,  -- provider's immutable ID for this contact
  raw_metadata         JSON DEFAULT NULL,
  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_provider_mapping (tenant_id, provider, provider_account_id, provider_contact_id),
  KEY idx_pm_client (tenant_id, client_id),
  KEY idx_pm_lead (tenant_id, lead_id),
  KEY idx_pm_broker (tenant_id, broker_id),
  CONSTRAINT chk_pm_one_owner CHECK (
    (client_id IS NOT NULL) + (lead_id IS NOT NULL) + (broker_id IS NOT NULL) = 1
  ),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (broker_id) REFERENCES brokers(id) ON DELETE CASCADE
);

-- Idempotent event log for all inbound provider events
CREATE TABLE sync_events (
  id                INT NOT NULL AUTO_INCREMENT,
  tenant_id         INT NOT NULL,
  idempotency_key   VARCHAR(255) NOT NULL,
  provider          ENUM('twilio','office365','google','whatsapp','instagram') NOT NULL,
  event_type        VARCHAR(100) NOT NULL,
  raw_payload       JSON NOT NULL,
  normalized_payload JSON DEFAULT NULL,
  status            ENUM('pending','processing','done','failed') NOT NULL DEFAULT 'pending',
  -- resolved entity (set after resolveIdentity runs):
  entity_type       ENUM('client','lead','broker') DEFAULT NULL,
  entity_id         INT DEFAULT NULL,
  error_detail      TEXT DEFAULT NULL,
  attempts          INT NOT NULL DEFAULT 0,
  processed_at      DATETIME DEFAULT NULL,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sync_idempotency (idempotency_key),
  KEY idx_sync_status (status, created_at),
  KEY idx_sync_tenant (tenant_id, created_at),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Duplicate detection queue (applies to clients only; leads are promoted, not merged)
CREATE TABLE merge_candidates (
  id           INT NOT NULL AUTO_INCREMENT,
  tenant_id    INT NOT NULL,
  client_id_a  INT NOT NULL,   -- FK → clients(id)
  client_id_b  INT NOT NULL,   -- FK → clients(id)
  confidence   DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  signals      JSON NOT NULL,  -- {"phone": true, "email": false, "name_similarity": 0.85}
  status       ENUM('pending','approved','rejected','auto_merged') NOT NULL DEFAULT 'pending',
  reviewed_by  INT DEFAULT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at  DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_merge_pair (tenant_id, client_id_a, client_id_b),
  KEY idx_mc_status (tenant_id, status),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id_a) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id_b) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES brokers(id) ON DELETE SET NULL
);

-- Full ownership audit trail for conversations
CREATE TABLE conversation_ownership_log (
  id              INT NOT NULL AUTO_INCREMENT,
  tenant_id       INT NOT NULL,
  conversation_id VARCHAR(100) NOT NULL,
  broker_id       INT DEFAULT NULL,
  action          ENUM('assigned','claimed','transferred','auto_assigned','unassigned') NOT NULL,
  reason          VARCHAR(255) DEFAULT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_col_conv (tenant_id, conversation_id),
  KEY idx_col_broker (broker_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
```

#### Changes to existing tables

```sql
-- conversation_threads: add explicit ownership column (no columns removed)
ALTER TABLE conversation_threads ADD COLUMN owner_broker_id INT DEFAULT NULL
  COMMENT 'Explicit owning CRM broker; backfilled from broker_id COALESCE logic';
ALTER TABLE conversation_threads ADD KEY idx_ct_owner_broker (owner_broker_id);
-- broker_id column KEPT for backward compat; owner_broker_id is the new authority
-- contact_broker_id column already exists — no change needed
-- client_id / lead_id already exist — no change needed

-- calendar_events: add external provider tracking to prevent reconnect duplicates
ALTER TABLE calendar_events ADD COLUMN external_provider VARCHAR(50) DEFAULT NULL
  COMMENT 'Provider name: internal | google | office365';
ALTER TABLE calendar_events ADD COLUMN external_event_id VARCHAR(255) DEFAULT NULL
  COMMENT 'Provider-assigned immutable event ID';
ALTER TABLE calendar_events ADD UNIQUE KEY uq_cal_event_external
  (tenant_id, external_provider, external_event_id);
-- Birthday events get: external_provider='internal', external_event_id='birthday_{client_id}'

-- communications: index external_id for fast dedup (already stored, just not indexed per-tenant)
ALTER TABLE communications ADD KEY idx_comm_external_id (tenant_id, external_id);

-- clients: no structural changes needed in Phase 0-2
-- The existing idx_clients_tenant_norm_phone index already exists
-- UNIQUE constraint on normalized_phone added ONLY after Phase 1 dedup is complete

### 3.8 Merge Strategy & Confidence Scoring

Merging applies to **`clients` records only** (duplicate borrower records). Leads are promoted to clients, not merged. Partner realtors (brokers) are not merged.

1. **Detection** (automated): background reconciliation job scores candidate client pairs
2. **Approval** (human): broker/admin reviews merge queue in UI

**Confidence scoring** (for `clients` dedup):

| Signal                                 | Score |
| -------------------------------------- | ----- |
| Same normalized phone (last-10 digits) | +30   |
| Same email (lowercase, trimmed)        | +40   |
| Same name (Levenshtein ≤ 2)            | +10   |
| Same assigned_broker_id                | +5    |
| Same loan application (shared client)  | +15   |
| Provider confirms same contact         | +50   |
| **Auto-merge threshold**               | ≥ 90  |
| **Suggest merge threshold**            | ≥ 50  |
| **Ignore below**                       | < 30  |

```

Auto-merge (≥ 90): Only when provider explicitly confirms identity
(e.g., Google OAuth returns same google_id as existing record)

Suggest merge (50–89): Enqueue to merge_candidates, notify admin

Ignore (< 30): Log but take no action

```

**Merge operation** (when approved, clients only):

1. Pick the survivor client record (usually the one with more data / more recent activity)
2. Transfer all FKs: `loan_applications`, `conversation_threads`, `calendar_events`, `documents` → survivor_id
3. Transfer `channel_identities` (update `client_id` to survivor)
4. Transfer `provider_mappings` (update `client_id` to survivor)
5. Soft-delete the loser client: set `status='inactive'`, add a note in `notes` field
6. Write to `audit_logs` with full before/after state

**Merge is reversible** (for 30 days):

- Audit log preserves original FKs
- `status='inactive'` (not deleted) allows restore by admin

---

### 3.9 Conversation → Contact Relationship

**Target state**: Every `conversation_thread` resolves to exactly one contact via `client_id` OR `lead_id` OR `contact_broker_id` (the three-way union already partially in place). `client_name`, `client_phone`, `client_email` are kept as **denormalized caches** — no breaking changes.

```

conversation_threads.client_id → clients.id (mortgage borrower thread)
conversation_threads.lead_id → leads.id (pre-qualification pipeline thread)
conversation_threads.contact_broker_id → brokers.id (partner realtor IS the contact)
conversation_threads.broker_id → brokers.id (CRM mortgage banker who HANDLES the thread)
conversation_threads.owner_broker_id → brokers.id (new: explicit ownership column)

```

**The three conversation types**:
1. **Broker → Client**: `client_id` set, `lead_id` null, `contact_broker_id` null
2. **Broker → Lead** (pre-qual): `lead_id` set, `client_id` null, `contact_broker_id` null
3. **Broker → Partner Realtor**: `contact_broker_id` set, `client_id` null, `lead_id` null

**"Unknown Client" is eliminated** because:

1. `resolveIdentity()` always creates a `leads` record for first-time unknown callers
2. Unknown phone-only callers get a lead with placeholder email (`noemail_{phone}@noemail.placeholder`) — matching the existing pattern already used for imported contacts (`noemail_*@imported.local`)
3. Thread is linked to `lead_id` immediately — broker sees "New Lead" not "Unknown Client"
4. When broker saves full contact, lead is promoted via the existing `leads.converted_to_client_id` FK + `handleCreateClient` flow
5. Thread's `client_id` is then updated, `lead_id` cleared (existing backfill pattern already in `api/index.ts`)

---

### 3.10 Reconnect / Re-auth Flow

When a provider account (e.g., Office 365 mailbox) is disconnected and reconnected:

```

CURRENT (broken):
Reconnect → new mailbox record OR re-auth → delta link reset →
re-syncs old messages → duplicate communications created

TARGET:

1. Reconnect → identify existing mailbox by (tenant_id, provider, mailbox_email)
2. If found: UPDATE oauth tokens, reset delta link, DO NOT recreate mailbox row
3. Re-sync: idempotency_key prevents duplicate communications
4. provider_mappings: provider_contact_id is immutable → no identity recreation
5. calendar_events: external_event_id UNIQUE constraint → duplicates blocked at DB level

```

**Reconnect flow**:

```

POST /api/conversations/mailboxes/office365/callback
→ verifyOffice365State()
→ UPSERT conversation_email_mailboxes ON DUPLICATE KEY UPDATE tokens only
→ Reset delta link (triggers full re-sync)
→ Re-sync runs: idempotency_key on sync_events blocks duplicates
→ No new contact records created if provider_mappings already resolves to existing client/lead

```

---

### 3.11 Calendar Sync

**Problem**: `calendar_events` has no `external_event_id`. If Google Calendar or Office 365 Calendar is reconnected, birthday/meeting events are re-inserted as duplicates.

**Fix**:

1. Add `(external_provider, external_event_id)` UNIQUE constraint
2. Auto-generated events (birthdays from client DOB) get `external_provider = 'internal'`, `external_event_id = 'birthday_{client_id}'`
3. Google Calendar events: `external_provider = 'google'`, `external_event_id = googleEventId`
4. Office 365 events: `external_provider = 'office365'`, `external_event_id = graph_event_id`
5. All calendar upserts use: `INSERT ... ON DUPLICATE KEY UPDATE title=..., event_date=...`

**For future Google/O365 calendar sync**:

- Calendar sync events go through `sync_events` table (idempotency guaranteed)
- `resolveIdentity()` called for each attendee → links calendar_event to person
- No free-text `linked_person_name` for known contacts (use `linked_client_id` FK instead)

---

### 3.12 Async Event Processing & Queue Architecture

**Current**: Synchronous webhook processing inside HTTP request handlers
**Target**: Webhook handlers are thin — receive, validate, persist to `sync_events`, return 200

```

Inbound Webhook (Twilio/Graph)
│
▼ < 50ms
[Sync Guard]
Validate signature
Compute idempotency key
INSERT sync_events (status=pending)
Return 200
│
▼ (async worker, separate process or setTimeout)
[Event Processor]
Pull pending sync_events
Run resolveIdentity()
Run assignOwnership()
upsertConversationThread()
insertCommunication()
publishAbly()
UPDATE sync_events (status=done)

````

**Queue options** (in order of complexity):

1. **Simple (current scale)**: `setTimeout(process, 0)` + `sync_events` table as durable queue
2. **Medium**: Bull/BullMQ (Redis-backed) job queue — no infrastructure change needed
3. **Enterprise**: AWS SQS or Google Pub/Sub — if multi-server deployment needed

**Retry strategy**:

- `sync_events.attempts` incremented on each try
- Exponential backoff: 30s, 2m, 10m, 1h, 24h
- After 5 failures: `status = 'failed'`, alert sent to admin
- Dead letter queue: failed events visible in admin UI for manual replay

---

### 3.13 Distributed Locking

**Race condition scenario**: Two Twilio webhook retries arrive 50ms apart for the same SMS MessageSid.

**Current protection**: None. Both can INSERT into `communications` simultaneously before the `external_id` is available for dedup.

**Recommended protection**:

1. **Primary**: `sync_events.idempotency_key` UNIQUE constraint — second INSERT fails, returns 200 immediately. No lock needed.
2. **Secondary**: For `conversation_threads` upsert: MySQL `ON DUPLICATE KEY UPDATE` is atomic. No additional locking needed.
3. **For identity resolution**: Wrap `resolveIdentity()` in a per-tenant advisory lock if concurrent creates of the same phone are a concern:
   ```sql
   SELECT GET_LOCK(CONCAT('identity_', tenant_id, '_', normalized_phone), 5)
   -- ... resolveIdentity logic ...
   SELECT RELEASE_LOCK(...)
````

4. **TiDB note**: `GET_LOCK()` is supported in TiDB Cloud Serverless. Test before relying on it.

---

### 3.14 Observability & Audit Trail

**Every identity resolution writes to `audit_logs`**:

```json
{
  "action": "identity_resolved",
  "entity_type": "client",
  "entity_id": 12345,
  "changes": {
    "signals": { "phone": "+19095279692", "email": null },
    "resolution": "phone_lookup",
    "candidates": [{ "entityType": "client", "entityId": 12345 }],
    "hadConflict": false
  }
}
```

**Every ownership change writes to `conversation_ownership_log`**:

```json
{
  "conversation_id": "conv_client_750015",
  "broker_id": 3,
  "action": "claimed",
  "reason": "broker_replied_outbound"
}
```

**Sync event status dashboard** (new admin page):

- Count of `sync_events` by status
- Failed events list with raw payload + error
- Manual replay button per event
- Merge candidate queue

---

### 3.15 Migration Strategy

#### Phase 0 — Constraints (no user impact, ~1 day)

1. Add `sync_events` table
2. Add `external_event_id` to `calendar_events` with UNIQUE constraint
3. Index `communications.external_id` per tenant
4. Add `communications` idempotency: stamp `external_id` at INSERT time for Twilio

#### Phase 1 — Deduplication (data migration, ~1 week)

1. Run dedup analysis query: find all `(tenant_id, normalized_phone)` with count > 1
2. Generate `merge_candidates` rows for all confirmed duplicates
3. Admin UI: review merge queue, approve merges (manual step)
4. Execute approved merges: update FKs, soft-delete losers

#### Phase 2 — Channel Identities table (schema + backfill, ~1 week)

1. Create `channel_identities` table (three-way nullable FK: `client_id` | `lead_id` | `broker_id`)
2. Backfill from `clients.phone` + `clients.email` → `client_id` rows
3. Backfill from `leads.phone` + `leads.email` → `lead_id` rows
4. Backfill from `brokers.phone` + `brokers.email` → `broker_id` rows (partner realtors, role='broker')
5. Add `UNIQUE(tenant_id, channel, normalized_handle)` after backfill + dedup
6. Replace 7 identity resolution code paths with `resolveIdentity()`
7. Add `conversation_threads.owner_broker_id`, backfill from existing `broker_id` COALESCE logic

> **No Phase 3 persons table.** The three existing entity tables are the canonical anchors.

#### Phase 3 — Sync Guard (deploy, ~3 days)

1. Deploy `sync_events` table + idempotency guard to all webhook handlers
2. Process events asynchronously (start with `setTimeout`, upgrade to queue later)
3. Monitor `sync_events` table for failures

#### Phase 4 — Ownership Engine (deploy, ~1 week)

1. Deploy `conversation_ownership_log` table
2. Deploy `assignOwnership()` — writes to log on every ownership decision
3. Populate `conversation_threads.owner_broker_id` from current `broker_id` logic
4. Migrate: `owner_broker_id` becomes the authoritative column; `broker_id` deprecated

#### Phase 5 — Provider Mappings (deploy, ~1 week)

1. Create `provider_mappings` table
2. Backfill from known Office 365 contact IDs (if stored in sync metadata)
3. All new inbound events write to `provider_mappings` after `resolveIdentity()`

#### Phase 6 — Reconnect flows (deploy, ~3 days)

1. Update Office 365 callback: UPSERT mailbox on DUPLICATE KEY
2. Update Google Calendar (future): same pattern
3. Test: disconnect + reconnect + verify no duplicates

---

### 3.16 Backward Compatibility

| Existing code                                         | Migration path                                                                                 |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `clients.id` used as FK everywhere                    | No change — `clients` remains the canonical mortgage borrower table                            |
| `clients.income_type NOT NULL`                        | No change — stays on `clients`, not abstracted into any new table                              |
| `clients.password_hash` (portal login)                | No change — `clients.id` is the auth anchor                                                    |
| `leads.converted_to_client_id` promotion flow         | No change — `resolveIdentity()` returns `entityType='lead'`; broker promotes via existing flow |
| `conversation_threads.client_id`                      | No change; `lead_id` and `contact_broker_id` already exist alongside it                        |
| `conversation_threads.broker_id`                      | Kept; `owner_broker_id` added as a new parallel column, not a replacement                      |
| `conversation_threads.contact_broker_id`              | No change — semantics fully preserved (partner realtor IS the contact)                         |
| `conv_client_*`, `conv_phone_*`, `conv_unknown_*` IDs | Kept as-is (immutable PKs)                                                                     |
| `client_name` denormalized cache on threads           | No change — kept as a display cache                                                            |
| `brokers.role='broker'` = partner realtors            | No change — `resolveIdentity()` explicitly looks in `brokers` for realtor contexts             |
| All existing API endpoints                            | No breaking changes throughout all phases                                                      |
| Frontend components                                   | No changes needed until Phase 4+                                                               |

---

### 3.17 P0 / P1 Risk Analysis

| Risk                                                                         | Severity | Mitigation                                                   |
| ---------------------------------------------------------------------------- | -------- | ------------------------------------------------------------ |
| Same phone on 3 clients causes random inbound routing                        | P0       | Phase 1 dedup + merge                                        |
| Outbound to wrong client thread (fixed today for wizard)                     | P0       | Already fixed (May 26 patch)                                 |
| Twilio webhook retry creates duplicate communication                         | P0       | Phase 0: index `external_id`                                 |
| Provider reconnect recreates calendar events                                 | P1       | Phase 0: add `external_event_id` UNIQUE                      |
| Office 365 reconnect creates duplicate email threads                         | P1       | Already partially handled by `external_id` dedup in syncO365 |
| Inbound SMS from shared phone routes to wrong broker                         | P1       | Phase 1 dedup + Phase 4 Ownership Engine                     |
| `resolveIdentity` race condition on concurrent webhooks                      | P1       | Phase 4 Sync Guard (idempotency key)                         |
| Calendar sync creates duplicate birthday events on reconnect                 | P1       | Phase 0: `external_event_id` UNIQUE                          |
| `conv_phone_*` and `conv_client_*` coexist for same phone                    | P1       | Phase 2 dedup + `channel_identities` unifies lookup          |
| Future provider (Instagram) creates new identity instead of linking existing | P2       | Phase 6: `provider_mappings` table                           |

---

### 3.18 Recommended Entity Designs (Detailed)

#### Client (canonical mortgage borrower)

```
clients.id             — immutable PK; used in portal auth, all FKs
clients.income_type    — NOT NULL; mortgage-required field
clients.password_hash  — client portal login anchor
clients.normalized_phone — maintained by app on every write
```

#### Lead (pre-qualification pipeline)

```
leads.id                  — immutable PK
leads.status              — new → contacted → qualified → converted/lost
leads.converted_to_client_id — FK to clients after promotion
leads.email               — NOT NULL (placeholder 'noemail_*' for phone-only)
```

#### ChannelIdentity (new `channel_identities` table)

One row per handle. Three-way nullable FK: exactly one of `client_id`, `lead_id`, `broker_id` is non-NULL. The UNIQUE constraint on `(tenant_id, channel, normalized_handle)` is the deduplication enforcement point.

#### ConversationOwnership (new `conversation_ownership_log` table)

Every ownership change is logged immutably. Current owner is always the most recent row for that `conversation_id`.

#### CalendarAccount (future: `calendar_accounts` table)

For Google Calendar / O365 Calendar integration:

```sql
CREATE TABLE calendar_accounts (
  id               INT NOT NULL AUTO_INCREMENT,
  tenant_id        INT NOT NULL,
  broker_id        INT NOT NULL,
  provider         ENUM('google','office365') NOT NULL,
  account_email    VARCHAR(255) NOT NULL,
  oauth_tokens     JSON NOT NULL,
  last_sync_at     DATETIME DEFAULT NULL,
  delta_link       TEXT DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cal_account (tenant_id, provider, account_email)
);
```

#### CalendarEvent (revised `calendar_events`)

Add `external_provider` + `external_event_id` UNIQUE constraint (Phase 0). Use existing `linked_client_id` FK for clients; future: add `linked_lead_id` if calendar events should link to leads.

#### SyncEvent (new `sync_events` table)

Idempotent event log. Every inbound provider event gets one row. Duplicate events (webhook retries) hit the UNIQUE key on `idempotency_key` and are silently dropped.

#### MergeCandidate (new `merge_candidates` table)

Human review queue. No auto-merge unless confidence ≥ 90 (provider-confirmed identity).

---

### 3.19 Recommended Sync Lifecycle

```
1. Provider sends event (Twilio, Graph, etc.)
2. Sync Guard: validate signature, compute idempotency key, INSERT sync_events
3. Async: normalize event via Provider Adapter
4. Identity Engine: resolveIdentity(signals) → {entityType, entityId}
5. Ownership Engine: assignOwnership({entityType, entityId}, inboxNumber, ...) → brokerId
6. Thread Engine: upsertConversationThread({entityType, entityId}, channel, brokerId, ...) → convId
7. Communication Engine: insertCommunication(convId, ...) → commId
8. Real-time: publishAbly(convId, newMessage)
9. Sync Guard: UPDATE sync_events SET status='done'
10. (Background) Dedup: check for merge candidates based on new identity
```

---

### 3.20 How to Prevent "Unknown Client" Permanently

1. **`resolveIdentity()` always creates a record** — unknown callers become `leads` with status='new', not a generic 'prospect' type
2. **Placeholder email** for phone-only contacts: `noemail_{normalized_phone}@noemail.placeholder` (pattern already used in the system for imported contacts)
3. **Thread is linked immediately** via `lead_id` — broker sees "New Lead" not "Unknown Client"
4. **Lead → Client promotion** via existing `handleCreateClient` flow: sets `leads.converted_to_client_id`, backfills thread's `client_id`, clears `lead_id`
5. **`channel_identities` UNIQUE constraint** prevents duplicate identity creation for the same phone/email
6. **Dedup queue** (`merge_candidates`) surfaces duplicate clients to broker for manual review

---

## 4. Rollout Strategy

| Phase                       | Timeline | Who                        | Risk                            |
| --------------------------- | -------- | -------------------------- | ------------------------------- |
| Phase 0: Constraints        | Week 1   | Backend dev                | Low — additive only             |
| Phase 1: Dedup              | Week 2–3 | Backend dev + Admin review | Medium — data changes           |
| Phase 2: Channel Identities | Week 3–4 | Backend dev                | Low — additive                  |
| Phase 3: Sync Guard         | Week 4–5 | Backend dev                | Medium — async processing       |
| Phase 4: Ownership Engine   | Week 5–7 | Backend dev                | Medium — ownership model change |
| Phase 5: Provider Mappings  | Week 7–8 | Backend dev                | Low — additive                  |
| Phase 6: Reconnect flows    | Week 8–9 | Backend dev + QA           | Medium — auth flows             |

---

## 5. Immediate Next Steps (Before Any Code)

1. **Review this document** with team — validate design decisions
2. **Run dedup analysis** query in prod to quantify scope of duplicate problem:
   ```sql
   SELECT normalized_phone, COUNT(*) as cnt, GROUP_CONCAT(id) as ids
   FROM clients WHERE tenant_id = 1 AND normalized_phone IS NOT NULL
   GROUP BY normalized_phone HAVING cnt > 1
   ORDER BY cnt DESC;
   ```
3. **Approve merge candidates** from above query — human review of real duplicates
4. **Phase 0 migration** (constraints only, zero user impact) — can start immediately
5. **Design merge review UI** — brokers need to see and approve merge candidates

---

_Document authored: May 26, 2026_  
_Based on full audit of `database/schema.sql`, `api/index.ts`, and live DB query results._
