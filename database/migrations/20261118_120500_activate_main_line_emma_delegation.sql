-- Migration: 20261118_120500_activate_main_line_emma_delegation
-- Apply AFTER the code from 20261118 (main line + delegations) is deployed.
-- Converts (562) 337-0000 from Emma Sanchez's personal line into the shared
-- company main line, puts Emma in the main-line ring group, and grants Emma
-- delegated access to Daniel Carrillo's clients, realtors, conversations and line.

UPDATE `system_settings`
SET `setting_value` = '+15623370000'
WHERE `setting_key` = 'main_line_number' AND `tenant_id` = 1;

UPDATE `system_settings`
SET `setting_value` = '[2880002]'
WHERE `setting_key` = 'main_line_ring_broker_ids' AND `tenant_id` = 1;

UPDATE `brokers`
SET `twilio_caller_id` = NULL, `twilio_phone_sid` = NULL, `updated_at` = NOW()
WHERE `id` = 2880002 AND `tenant_id` = 1 AND `email` = 'emma@encoremortgage.org'
  AND `twilio_caller_id` = '+15623370000';

INSERT INTO `broker_delegations`
  (`tenant_id`, `owner_broker_id`, `delegate_broker_id`, `can_view_clients`, `can_view_realtors`,
   `can_view_conversations`, `can_send_from_line`, `created_by_broker_id`)
VALUES (1, 3, 2880002, 1, 1, 1, 1, 3)
ON DUPLICATE KEY UPDATE
  `can_view_clients` = 1, `can_view_realtors` = 1, `can_view_conversations` = 1,
  `can_send_from_line` = 1, `revoked_at` = NULL;
