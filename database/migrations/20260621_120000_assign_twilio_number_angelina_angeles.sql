-- Assign Twilio line (562) 573-7760 to Angelina Angeles (broker id 330002).
-- Number SID from Twilio account: PNd0c49d95b720a62c22195f26a82d66c2
-- Inbound routing: handleVoiceIncoming matches brokers.twilio_caller_id exclusively.

-- Clear any prior assignment of this number
UPDATE `brokers`
SET `twilio_caller_id` = NULL, `twilio_phone_sid` = NULL
WHERE `tenant_id` = 1
  AND (`twilio_caller_id` = '+15625737760' OR `twilio_phone_sid` = 'PNd0c49d95b720a62c22195f26a82d66c2');

UPDATE `brokers`
SET
  `twilio_phone_sid` = 'PNd0c49d95b720a62c22195f26a82d66c2',
  `twilio_caller_id` = '+15625737760',
  `updated_at` = NOW()
WHERE `id` = 330002
  AND `tenant_id` = 1
  AND `email` = 'Angelina@encoremortgage.org';

-- Enable default voicemail greeting for personal line
UPDATE `brokers`
SET
  `voicemail_enabled` = 1,
  `voicemail_greeting_text` = CONCAT(
    'Hi, you''ve reached ',
    `first_name`,
    ' ',
    `last_name`,
    '. I''m unable to take your call right now. Please leave your name, ',
    'number, and a brief message after the tone, and I''ll get back to you ',
    'as soon as possible. Thank you.'
  ),
  `updated_at` = NOW()
WHERE `id` = 330002
  AND `tenant_id` = 1
  AND `voicemail_enabled` IS NULL;
