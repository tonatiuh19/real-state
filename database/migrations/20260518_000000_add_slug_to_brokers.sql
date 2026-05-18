-- Migration: 20260518_000000_add_slug_to_brokers
-- Adds a human-readable `slug` column to the brokers table.
-- Used for short public URLs: /apply/{slug} and /scheduler/{slug}
-- The slug is nullable; existing rows remain NULL until auto-generated at next login.
-- UUID-based public_token links continue to work unchanged (dual-lookup in API).

ALTER TABLE brokers
  ADD COLUMN `slug` VARCHAR(64) NULL
    COMMENT 'Human-readable broker slug for short public URLs e.g. alexgomez (used in /apply/ and /scheduler/)'
    AFTER `public_token`;

ALTER TABLE brokers
  ADD UNIQUE KEY `uk_brokers_slug` (`slug`);
