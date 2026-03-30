-- Migration: Fix reminder_flow_steps.step_type ENUM missing wait_until_date value
-- Background: The 20260312_220000 seed migration inserted 'wait_until_date' as step_type
-- but never ALTER'd the ENUM, causing MySQL (non-strict) to silently store '' instead.
-- This migration adds 'wait_until_date' to the ENUM and corrects the corrupted row.

ALTER TABLE `reminder_flow_steps`
  MODIFY `step_type` enum(
    'trigger','wait','send_notification','send_email','send_sms',
    'send_whatsapp','condition','branch','wait_for_response','wait_until_date','end'
  ) COLLATE utf8mb4_unicode_ci NOT NULL;

UPDATE `reminder_flow_steps`
   SET `step_type` = 'wait_until_date'
 WHERE `step_key` = 'wait_close_date'
   AND `step_type` = '';
