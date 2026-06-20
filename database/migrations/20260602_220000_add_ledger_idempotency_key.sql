-- Idempotency key for tenant_usage_ledger (Stripe top-up webhook + confirm race safety).
-- NULL keys are allowed; only top-up rows set a key.

ALTER TABLE tenant_usage_ledger
  ADD COLUMN idempotency_key VARCHAR(150) DEFAULT NULL AFTER metadata_json;

CREATE UNIQUE INDEX uk_tul_idempotency ON tenant_usage_ledger (tenant_id, idempotency_key);
