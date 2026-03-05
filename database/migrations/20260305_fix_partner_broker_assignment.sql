-- Migration: Fix partner broker assignments in loan_applications
-- Date: 2026-03-05
-- Description:
--   When a client submits via a partner (role='broker') share link, the partner
--   was incorrectly stored in broker_user_id (Mortgage Banker field).
--   This migration:
--   1. Moves the partner broker into partner_broker_id for all affected loans
--      where broker_user_id references a role='broker' (partner) broker.
--   2. Clears broker_user_id so the admin can manually assign the Mortgage Banker.
--   3. Specifically for loan id=29 (LA77937794): assigns Alex Gomez (id=1) as
--      Mortgage Banker and Tonatiuh Gomez (id=8) as Partner, per admin request.

-- Step 1: For all existing loans in tenant 1 where broker_user_id points to a
--         partner broker (role='broker'), migrate them to partner_broker_id.
UPDATE loan_applications la
INNER JOIN brokers b ON la.broker_user_id = b.id AND b.role = 'broker'
SET
  la.partner_broker_id = la.broker_user_id,
  la.broker_user_id    = NULL
WHERE la.tenant_id = 1
  AND la.partner_broker_id IS NULL;

-- Step 2: Explicitly assign Alex Gomez (id=1) as Mortgage Banker for loan 29.
UPDATE loan_applications
SET broker_user_id = 1
WHERE id = 29
  AND tenant_id = 1;
