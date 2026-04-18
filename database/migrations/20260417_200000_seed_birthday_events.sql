-- ============================================================
-- Migration: 20260417_200000_seed_birthday_events.sql
-- Purpose : One-time backfill of calendar_events for birthdays
--           from existing clients and broker_profiles rows.
--           The "Sync Birthdays" button handles future upserts.
-- Safe to re-run: INSERT IGNORE skips existing rows.
-- ============================================================

-- ── 1. Client birthdays ──────────────────────────────────────
-- Inserts one yearly all-day birthday event per client that has
-- a date_of_birth and does not already have a birthday event.
INSERT IGNORE INTO calendar_events
  (tenant_id, broker_id, event_type, title, event_date, all_day, recurrence, linked_client_id)
SELECT
  c.tenant_id,
  -- attribute to the admin broker for this tenant (fallback to NULL)
  (SELECT b.id FROM brokers b WHERE b.tenant_id = c.tenant_id AND b.role = 'admin' LIMIT 1),
  'birthday',
  CONCAT(c.first_name, ' ', c.last_name, '''s Birthday'),
  DATE(c.date_of_birth),
  1,
  'yearly',
  c.id
FROM clients c
WHERE c.date_of_birth IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM calendar_events ce
    WHERE ce.tenant_id      = c.tenant_id
      AND ce.event_type     = 'birthday'
      AND ce.linked_client_id = c.id
  );

-- ── 2. Broker / partner birthdays ───────────────────────────
-- Inserts one yearly all-day birthday event per broker profile
-- that has a date_of_birth and no matching title entry yet.
INSERT IGNORE INTO calendar_events
  (tenant_id, broker_id, event_type, title, event_date, all_day, recurrence, linked_person_name)
SELECT
  b.tenant_id,
  (SELECT adm.id FROM brokers adm WHERE adm.tenant_id = b.tenant_id AND adm.role = 'admin' LIMIT 1),
  'birthday',
  CONCAT(
    b.first_name, ' ', b.last_name, '''s Birthday (',
    CASE WHEN b.role = 'admin' THEN 'Mortgage Banker' ELSE 'Partner' END,
    ')'
  ),
  DATE(bp.date_of_birth),
  1,
  'yearly',
  CONCAT(b.first_name, ' ', b.last_name)
FROM broker_profiles bp
JOIN brokers b ON b.id = bp.broker_id
WHERE bp.date_of_birth IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM calendar_events ce
    WHERE ce.tenant_id  = b.tenant_id
      AND ce.event_type = 'birthday'
      AND ce.title      = CONCAT(
            b.first_name, ' ', b.last_name, '''s Birthday (',
            CASE WHEN b.role = 'admin' THEN 'Mortgage Banker' ELSE 'Partner' END,
            ')'
          )
      AND ce.linked_client_id IS NULL
  );
