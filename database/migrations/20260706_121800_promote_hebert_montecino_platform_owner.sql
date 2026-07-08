-- Promote Hebert Montecino (hebert@trueduplora.com) to platform_owner.
-- Broker id 4 was admin (Mortgage Banker in UI).

UPDATE `brokers`
SET `role` = 'platform_owner',
    `updated_at` = NOW()
WHERE `id` = 4
  AND `tenant_id` = 1
  AND `email` = 'hebert@trueduplora.com'
  AND `role` = 'admin';
