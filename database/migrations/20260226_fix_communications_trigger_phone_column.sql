-- Fix update_conversation_thread trigger: clients.phone_number → clients.phone
DROP TRIGGER IF EXISTS `update_conversation_thread`;

DELIMITER $$
CREATE TRIGGER `update_conversation_thread` AFTER INSERT ON `communications` FOR EACH ROW BEGIN
    DECLARE client_name_var VARCHAR(255) DEFAULT NULL;
    DECLARE client_phone_var VARCHAR(20) DEFAULT NULL;
    DECLARE client_email_var VARCHAR(255) DEFAULT NULL;

    -- Get client information
    IF NEW.to_user_id IS NOT NULL THEN
        SELECT CONCAT(first_name, ' ', last_name), phone, email
        INTO client_name_var, client_phone_var, client_email_var
        FROM clients WHERE id = NEW.to_user_id;
    ELSEIF NEW.from_user_id IS NOT NULL THEN
        SELECT CONCAT(first_name, ' ', last_name), phone, email
        INTO client_name_var, client_phone_var, client_email_var
        FROM clients WHERE id = NEW.from_user_id;
    END IF;

    -- Upsert conversation thread
    INSERT INTO conversation_threads (
        tenant_id, conversation_id, application_id, lead_id, client_id, broker_id,
        client_name, client_phone, client_email, last_message_at,
        last_message_preview, last_message_type, message_count, unread_count
    ) VALUES (
        NEW.tenant_id,
        COALESCE(NEW.conversation_id, CONCAT('conv_', NEW.id)),
        NEW.application_id,
        NEW.lead_id,
        COALESCE(NEW.to_user_id, NEW.from_user_id),
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
        last_message_at     = NEW.created_at,
        last_message_preview = LEFT(NEW.body, 200),
        last_message_type   = NEW.communication_type,
        message_count       = message_count + 1,
        unread_count        = unread_count + CASE WHEN NEW.direction = 'inbound' THEN 1 ELSE 0 END;
END$$
DELIMITER ;
