-- Platform subscription price: $499 → $350/mo (Stripe price_1TkCTKP2VdesEhLQ0Zs554A6)

UPDATE tenant_subscription
SET platform_fee_usd = 350.00,
    updated_at = UTC_TIMESTAMP()
WHERE tenant_id = 1;
