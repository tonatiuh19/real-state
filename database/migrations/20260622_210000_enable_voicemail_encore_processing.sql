-- Enable personal-line voicemail for Encore Mortgage Processing (broker 270004).
-- voicemail_enabled was NULL after UI phone assignment; inbound personal-line
-- voicemail should inherit tenant defaults explicitly.

UPDATE `brokers`
SET
  `voicemail_enabled` = 1,
  `voicemail_greeting_text` = CONCAT(
    'Hi, you''ve reached ',
    `first_name`,
    ' ',
    `last_name`,
    '. I''m unable to take your call right now. Please leave your name, ',
    'number, and a brief message after the tone, and we''ll get back to you ',
    'as soon as possible. Thank you.'
  ),
  `updated_at` = NOW()
WHERE `id` = 270004
  AND `tenant_id` = 1
  AND `email` = 'Processing@encoremortgage.org'
  AND `voicemail_enabled` IS NULL;
