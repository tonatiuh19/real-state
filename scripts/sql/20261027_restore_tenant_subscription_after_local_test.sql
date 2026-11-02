-- URGENT one-off repair (NOT a schema migration).
-- On 2026-10-27 ~18:34 UTC a local UI test (dev server with the Stripe TEST
-- key, pointed at the production DB) called /api/billing/stripe/subscription-setup
-- and overwrote tenant 1's live Stripe IDs with sandbox IDs:
--   stripe_customer_id     cus_UgOT4dkzJitDIQ  -> cus_VWHm7Gm4wLwjJS (test)
--   stripe_subscription_id sub_1UTrK5P2VdesEhLQgJRfZv0A -> sub_1UVFCr04sI0kP0GKA0sn2RYO (test)
-- Restores the exact values read from production at 18:21:54 UTC the same day.
-- Guarded: only applies while the row still holds the test IDs.

UPDATE tenant_subscription
SET stripe_customer_id     = 'cus_UgOT4dkzJitDIQ',
    stripe_subscription_id = 'sub_1UTrK5P2VdesEhLQgJRfZv0A',
    status                 = 'canceled',
    past_due_at            = '2026-10-27 01:08:36',
    grace_ends_at          = '2026-10-30 01:08:36'
WHERE tenant_id = 1
  AND stripe_customer_id = 'cus_VWHm7Gm4wLwjJS'
  AND stripe_subscription_id = 'sub_1UVFCr04sI0kP0GKA0sn2RYO';

-- Verify: expect cus_UgOT4dkzJitDIQ / sub_1UTrK5P2VdesEhLQgJRfZv0A / canceled
SELECT status, stripe_customer_id, stripe_subscription_id, past_due_at, grace_ends_at
FROM tenant_subscription WHERE tenant_id = 1;
