-- Prevent duplicate broadcast delivery when multiple send workers run concurrently.
-- 'processing' = claimed by an active send worker; only one worker can claim pending rows.

ALTER TABLE realtor_broadcast_recipients
  MODIFY COLUMN email_status ENUM(
    'pending',
    'processing',
    'sent',
    'failed',
    'bounced',
    'unsubscribed',
    'skipped_no_contact'
  ) DEFAULT NULL;

ALTER TABLE realtor_broadcast_recipients
  MODIFY COLUMN sms_status ENUM(
    'pending',
    'processing',
    'sent',
    'failed',
    'undelivered',
    'opted_out',
    'skipped_no_contact'
  ) DEFAULT NULL;
