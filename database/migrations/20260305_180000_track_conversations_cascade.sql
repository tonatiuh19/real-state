-- ============================================================
-- Migration: Track all client interactions as conversations
--            + cascade conversation cleanup on client delete
--            + fix trigger phone_number bug
--            + add broker email reply template
-- Date: 2026-03-05
-- ============================================================

-- ----------------------------------------------------------------
-- 1. Fix the `update_conversation_thread` trigger.
--    Bug: it used `phone_number` but clients table has `phone`.
--    Also improve: fall back to `from_user_id` for client lookup.
-- ----------------------------------------------------------------

DELIMITER $$

DROP TRIGGER IF EXISTS `update_conversation_thread` $$

CREATE TRIGGER `update_conversation_thread`
AFTER INSERT ON `communications`
FOR EACH ROW
BEGIN
    DECLARE client_name_var  VARCHAR(255) DEFAULT NULL;
    DECLARE client_phone_var VARCHAR(20)  DEFAULT NULL;
    DECLARE client_email_var VARCHAR(255) DEFAULT NULL;
    DECLARE resolved_client_id INT DEFAULT NULL;

    -- Resolve the client (prefer to_user_id, fallback to from_user_id)
    SET resolved_client_id = COALESCE(NEW.to_user_id, NEW.from_user_id);

    -- Get client info when available
    IF resolved_client_id IS NOT NULL THEN
        SELECT CONCAT(first_name, ' ', last_name), phone, email
        INTO   client_name_var, client_phone_var, client_email_var
        FROM   clients
        WHERE  id = resolved_client_id
        LIMIT  1;
    END IF;

    -- Upsert conversation thread
    -- Key: (tenant_id, conversation_id) unique — set via the UNIQUE KEY below
    INSERT INTO conversation_threads (
        tenant_id, conversation_id, application_id, lead_id, client_id, broker_id,
        client_name, client_phone, client_email,
        last_message_at, last_message_preview, last_message_type,
        message_count, unread_count
    ) VALUES (
        NEW.tenant_id,
        COALESCE(NEW.conversation_id, CONCAT('conv_auto_', NEW.id)),
        NEW.application_id,
        NEW.lead_id,
        resolved_client_id,
        COALESCE(NEW.from_broker_id, NEW.to_broker_id),
        client_name_var,
        client_phone_var,
        client_email_var,
        NEW.created_at,
        LEFT(NEW.body, 200),
        NEW.communication_type,
        1,
        CASE WHEN NEW.direction = 'inbound' THEN 1 ELSE 0 END
    ) ON DUPLICATE KEY UPDATE
        last_message_at      = IF(NEW.created_at > last_message_at, NEW.created_at, last_message_at),
        last_message_preview = IF(NEW.created_at > last_message_at, LEFT(NEW.body, 200), last_message_preview),
        last_message_type    = IF(NEW.created_at > last_message_at, NEW.communication_type, last_message_type),
        message_count        = message_count + 1,
        unread_count         = unread_count + CASE WHEN NEW.direction = 'inbound' THEN 1 ELSE 0 END,
        -- Backfill client info if it was missing before
        client_name          = COALESCE(client_name, client_name_var),
        client_phone         = COALESCE(client_phone, client_phone_var),
        client_email         = COALESCE(client_email, client_email_var),
        updated_at           = NOW();
END $$

DELIMITER ;

-- ----------------------------------------------------------------
-- 2. Ensure conversation_threads has a UNIQUE constraint on
--    (tenant_id, conversation_id) so the ON DUPLICATE KEY UPDATE
--    works correctly. Add it if missing.
-- ----------------------------------------------------------------

SET @idx_exists = (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name   = 'conversation_threads'
      AND index_name   = 'uniq_tenant_conversation'
);

SET @sql = IF(
    @idx_exists = 0,
    'ALTER TABLE conversation_threads
     ADD UNIQUE KEY uniq_tenant_conversation (tenant_id, conversation_id)',
    'SELECT 1 -- index already exists'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ----------------------------------------------------------------
-- 3. Add broker email reply template.
--    This HTML template is used when a broker sends a direct
--    email message to a client through the Conversations section.
-- ----------------------------------------------------------------

INSERT INTO `templates` (
    `tenant_id`, `name`, `description`, `template_type`, `category`,
    `subject`, `body`, `variables`, `is_active`, `usage_count`,
    `created_by_broker_id`, `created_at`, `updated_at`
) VALUES (
    1,
    'Broker Email Reply',
    'Used when a broker sends a direct email to a client from the Conversations section.',
    'email',
    'follow_up',
    'Message from {{broker_name}} — {{subject_line}}',
    '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Message from {{broker_name}}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
        <!-- HEADER -->
        <tr>
          <td style="background-color:#ffffff;padding:24px 32px;border-radius:16px 16px 0 0;border-bottom:3px solid #e8192c;text-align:center;">
            <img src="https://disruptinglabs.com/data/encore/assets/images/logo.png" alt="Encore Mortgage" style="height:52px;width:auto;display:inline-block;" />
          </td>
        </tr>
        <!-- BODY -->
        <tr>
          <td style="background-color:#ffffff;padding:36px 32px 28px;">
            <p style="margin:0 0 6px 0;color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;">Message from your loan officer</p>
            <h2 style="margin:0 0 20px 0;color:#0f172a;font-size:20px;font-weight:700;">Hello {{client_name}},</h2>
            <!-- MESSAGE BODY -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
              <tr>
                <td style="background-color:#f8fafc;border-radius:10px;padding:18px 20px;border:1px solid #e2e8f0;">
                  <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;white-space:pre-wrap;">{{message_body}}</p>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 24px 0;color:#475569;font-size:14px;line-height:1.6;">
              If you have any questions or need assistance, feel free to reply directly to this email or log in to your Encore portal.
            </p>
            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="{{portal_url}}" style="display:inline-block;background-color:#e8192c;color:#ffffff;text-decoration:none;padding:12px 36px;border-radius:8px;font-weight:700;font-size:14px;">View My Application</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
              Sent by {{broker_name}} &middot; Encore Mortgage<br/>
              {{broker_email}}
            </p>
          </td>
        </tr>
        <!-- FOOTER -->
        <tr>
          <td style="background-color:#0f172a;padding:20px 32px;border-radius:0 0 16px 16px;text-align:center;">
            <p style="margin:0 0 4px 0;color:#ffffff;font-size:13px;font-weight:600;">Encore Mortgage</p>
            <p style="margin:0;color:#94a3b8;font-size:12px;">Your partner on the path to your new home</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>',
    '["client_name","broker_name","broker_email","message_body","subject_line","portal_url"]',
    1,
    0,
    1,
    NOW(),
    NOW()
);

-- ----------------------------------------------------------------
-- 4. Backfill client_phone for existing conversation_threads where
--    it is NULL but the client record has a phone number.
-- ----------------------------------------------------------------

UPDATE conversation_threads ct
  INNER JOIN clients c ON c.id = ct.client_id
SET ct.client_phone = c.phone,
    ct.client_name  = CONCAT(c.first_name, ' ', c.last_name),
    ct.client_email = COALESCE(ct.client_email, c.email),
    ct.updated_at   = NOW()
WHERE ct.client_phone IS NULL
  AND c.phone IS NOT NULL;
