-- Migration: Set all clients with NULL or unrecognized source to 'past_client'
-- Date: 2026-04-21
-- Description: Bulk-update clients.source to 'past_client' for all existing clients
--              that either have no source set or have a non-standard import value.

UPDATE clients
SET source = 'past_client',
    updated_at = NOW()
WHERE tenant_id = 1
  AND (
    source IS NULL
    OR source NOT IN (
      'current_client_referral',
      'past_client',
      'past_client_referral',
      'personal_friend',
      'realtor',
      'advertisement',
      'business_partner',
      'builder',
      'other'
    )
  );
