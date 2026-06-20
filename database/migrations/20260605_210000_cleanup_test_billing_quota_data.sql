-- Remove test Stripe top-up artifacts and reset quota period rows to plan defaults.
-- Canonical period follows tenant_subscription.period_start (2026-06-01 for tenant 1).
-- Safe before GA deploy while billing_quota_mode remains off.

DELETE FROM tenant_usage_ledger
WHERE tenant_id = 1
  AND action = 'top_up';

DELETE FROM tenant_usage_period
WHERE tenant_id = 1
  AND period_start <> (
    SELECT period_start FROM tenant_subscription WHERE tenant_id = 1 LIMIT 1
  );

DELETE FROM tenant_usage_period
WHERE tenant_id = 1
  AND period_start = (
    SELECT period_start FROM tenant_subscription WHERE tenant_id = 1 LIMIT 1
  );

INSERT INTO tenant_usage_period
  (tenant_id, period_start, dimension, included_units, used_units, reserved_units)
SELECT
  1,
  ts.period_start,
  dims.dimension,
  dims.included_units,
  0,
  0
FROM tenant_subscription ts
CROSS JOIN (
  SELECT 'sms_segments' AS dimension, 1000 AS included_units UNION ALL
  SELECT 'voice_minutes', 1500 UNION ALL
  SELECT 'email_sends', 5000 UNION ALL
  SELECT 'scheduler_bookings', 100 UNION ALL
  SELECT 'mortgi_ai_tokens', 500000
) dims
WHERE ts.tenant_id = 1;

DELETE FROM stripe_webhook_events;
