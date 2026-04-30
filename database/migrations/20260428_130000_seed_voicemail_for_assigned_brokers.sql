-- 20260428_130000_seed_voicemail_for_assigned_brokers.sql
-- Seed voicemail for brokers who already have a Twilio number assigned.
-- Voicemail is a per-personal-line feature, so any banker with a
-- twilio_caller_id should have it enabled by default with a sensible
-- personalized greeting. Brokers who have already explicitly set their
-- voicemail_enabled value (1 or 0) are left alone (only NULL rows are seeded).

UPDATE brokers
SET
  voicemail_enabled = 1,
  voicemail_greeting_text = CONCAT(
    'Hi, you''ve reached ',
    first_name,
    ' ',
    last_name,
    '. I''m unable to take your call right now. Please leave your name, ',
    'number, and a brief message after the tone, and I''ll get back to you ',
    'as soon as possible. Thank you.'
  )
WHERE
  twilio_caller_id IS NOT NULL
  AND twilio_caller_id <> ''
  AND voicemail_enabled IS NULL
  AND (voicemail_greeting_text IS NULL OR voicemail_greeting_text = '')
  AND (voicemail_greeting_url IS NULL OR voicemail_greeting_url = '');
