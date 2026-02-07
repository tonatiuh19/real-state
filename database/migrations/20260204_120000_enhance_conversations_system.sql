-- Migration: Enhance Conversations System
-- Created: 2026-02-04 12:00:00
-- Description: Enhance communications table to support conversations with WhatsApp, SMS and improved metadata

-- Add WhatsApp support to communication_type enum
ALTER TABLE `communications` 
MODIFY COLUMN `communication_type` ENUM('email','sms','whatsapp','call','internal_note') NOT NULL;

-- Add conversation threading support (check if columns exist first)
SET @sql = CONCAT('ALTER TABLE `communications` ADD COLUMN `conversation_id` VARCHAR(100) NULL AFTER `external_id`');
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'communications' AND column_name = 'conversation_id';
SET @sql = IF(@col_exists > 0, 'SELECT "conversation_id column already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = CONCAT('ALTER TABLE `communications` ADD COLUMN `thread_id` VARCHAR(100) NULL AFTER `conversation_id`');
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'communications' AND column_name = 'thread_id';
SET @sql = IF(@col_exists > 0, 'SELECT "thread_id column already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = CONCAT('ALTER TABLE `communications` ADD COLUMN `reply_to_id` INT(11) NULL AFTER `thread_id`');
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'communications' AND column_name = 'reply_to_id';
SET @sql = IF(@col_exists > 0, 'SELECT "reply_to_id column already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = CONCAT('ALTER TABLE `communications` ADD COLUMN `message_type` ENUM(\'text\',\'image\',\'document\',\'audio\',\'video\',\'template\') DEFAULT \'text\' AFTER `reply_to_id`');
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'communications' AND column_name = 'message_type';
SET @sql = IF(@col_exists > 0, 'SELECT "message_type column already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = CONCAT('ALTER TABLE `communications` ADD COLUMN `template_id` INT(11) NULL AFTER `message_type`');
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'communications' AND column_name = 'template_id';
SET @sql = IF(@col_exists > 0, 'SELECT "template_id column already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = CONCAT('ALTER TABLE `communications` ADD COLUMN `delivery_status` ENUM(\'pending\',\'sent\',\'delivered\',\'read\',\'failed\',\'rejected\') DEFAULT \'pending\' AFTER `template_id`');
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'communications' AND column_name = 'delivery_status';
SET @sql = IF(@col_exists > 0, 'SELECT "delivery_status column already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = CONCAT('ALTER TABLE `communications` ADD COLUMN `delivery_timestamp` DATETIME NULL AFTER `delivery_status`');
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'communications' AND column_name = 'delivery_timestamp';
SET @sql = IF(@col_exists > 0, 'SELECT "delivery_timestamp column already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = CONCAT('ALTER TABLE `communications` ADD COLUMN `read_timestamp` DATETIME NULL AFTER `delivery_timestamp`');
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'communications' AND column_name = 'read_timestamp';
SET @sql = IF(@col_exists > 0, 'SELECT "read_timestamp column already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = CONCAT('ALTER TABLE `communications` ADD COLUMN `error_code` VARCHAR(50) NULL AFTER `read_timestamp`');
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'communications' AND column_name = 'error_code';
SET @sql = IF(@col_exists > 0, 'SELECT "error_code column already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = CONCAT('ALTER TABLE `communications` ADD COLUMN `error_message` TEXT NULL AFTER `error_code`');
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'communications' AND column_name = 'error_message';
SET @sql = IF(@col_exists > 0, 'SELECT "error_message column already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = CONCAT('ALTER TABLE `communications` ADD COLUMN `cost` DECIMAL(10,4) NULL COMMENT \'Cost in USD for SMS/WhatsApp messages\' AFTER `error_message`');
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'communications' AND column_name = 'cost';
SET @sql = IF(@col_exists > 0, 'SELECT "cost column already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = CONCAT('ALTER TABLE `communications` ADD COLUMN `provider_response` JSON NULL COMMENT \'Full provider response for debugging\' AFTER `cost`');
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'communications' AND column_name = 'provider_response';
SET @sql = IF(@col_exists > 0, 'SELECT "provider_response column already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes for better performance (check if they exist first)
SET @sql = CONCAT('ALTER TABLE `communications` ADD INDEX `idx_conversation_id` (`conversation_id`)');
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'communications' AND index_name = 'idx_conversation_id';
SET @sql = IF(@idx_exists > 0, 'SELECT "idx_conversation_id already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = CONCAT('ALTER TABLE `communications` ADD INDEX `idx_thread_id` (`thread_id`)');
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'communications' AND index_name = 'idx_thread_id';
SET @sql = IF(@idx_exists > 0, 'SELECT "idx_thread_id already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = CONCAT('ALTER TABLE `communications` ADD INDEX `idx_reply_to_id` (`reply_to_id`)');
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'communications' AND index_name = 'idx_reply_to_id';
SET @sql = IF(@idx_exists > 0, 'SELECT "idx_reply_to_id already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = CONCAT('ALTER TABLE `communications` ADD INDEX `idx_message_type` (`message_type`)');
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'communications' AND index_name = 'idx_message_type';
SET @sql = IF(@idx_exists > 0, 'SELECT "idx_message_type already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = CONCAT('ALTER TABLE `communications` ADD INDEX `idx_delivery_status` (`delivery_status`)');
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'communications' AND index_name = 'idx_delivery_status';
SET @sql = IF(@idx_exists > 0, 'SELECT "idx_delivery_status already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = CONCAT('ALTER TABLE `communications` ADD INDEX `idx_delivery_timestamp` (`delivery_timestamp`)');
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'communications' AND index_name = 'idx_delivery_timestamp';
SET @sql = IF(@idx_exists > 0, 'SELECT "idx_delivery_timestamp already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint for reply_to_id (check if exists first)
SET @sql = CONCAT('ALTER TABLE `communications` ADD CONSTRAINT `fk_communications_reply_to` FOREIGN KEY (`reply_to_id`) REFERENCES `communications` (`id`) ON DELETE SET NULL');
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists FROM information_schema.key_column_usage WHERE table_schema = DATABASE() AND table_name = 'communications' AND constraint_name = 'fk_communications_reply_to';
SET @sql = IF(@fk_exists > 0, 'SELECT "fk_communications_reply_to already exists"', @sql);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create conversations summary table for better UI performance
CREATE TABLE IF NOT EXISTS `conversation_threads` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` INT(11) NOT NULL DEFAULT 1,
  `conversation_id` VARCHAR(100) NOT NULL,
  `application_id` INT(11) NULL,
  `lead_id` INT(11) NULL,
  `client_id` INT(11) NULL,
  `broker_id` INT(11) NOT NULL,
  `client_name` VARCHAR(255) NULL,
  `client_phone` VARCHAR(20) NULL,
  `client_email` VARCHAR(255) NULL,
  `last_message_at` DATETIME NOT NULL,
  `last_message_preview` TEXT NULL,
  `last_message_type` ENUM('email','sms','whatsapp','call','internal_note') NOT NULL,
  `message_count` INT(11) DEFAULT 0,
  `unread_count` INT(11) DEFAULT 0,
  `priority` ENUM('low','normal','high','urgent') DEFAULT 'normal',
  `status` ENUM('active','archived','closed') DEFAULT 'active',
  `tags` JSON NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_tenant_application` (`tenant_id`, `application_id`),
  KEY `idx_tenant_lead` (`tenant_id`, `lead_id`), 
  KEY `idx_tenant_client` (`tenant_id`, `client_id`),
  KEY `idx_broker_id` (`broker_id`),
  KEY `idx_last_message_at` (`last_message_at`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`),
  CONSTRAINT `fk_conversation_threads_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conversation_threads_application` FOREIGN KEY (`application_id`) REFERENCES `loan_applications` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_conversation_threads_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_conversation_threads_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_conversation_threads_broker` FOREIGN KEY (`broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create general communication templates table for all message types
CREATE TABLE IF NOT EXISTS `templates` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` INT(11) NOT NULL DEFAULT 1,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `template_type` ENUM('email','sms','whatsapp') NOT NULL,
  `category` ENUM('welcome','reminder','update','follow_up','marketing','system') DEFAULT 'system',
  `subject` VARCHAR(255) NULL COMMENT 'For email templates',
  `body` TEXT NOT NULL,
  `variables` JSON NULL COMMENT 'Available template variables',
  `is_active` BOOLEAN DEFAULT TRUE,
  `usage_count` INT(11) DEFAULT 0,
  `created_by_broker_id` INT(11) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_type` (`tenant_id`, `template_type`),
  KEY `idx_category` (`category`),
  KEY `idx_active` (`is_active`),
  KEY `idx_created_by` (`created_by_broker_id`),
  CONSTRAINT `fk_templates_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_templates_broker` FOREIGN KEY (`created_by_broker_id`) REFERENCES `brokers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default multi-channel templates
INSERT INTO `templates` (`tenant_id`, `name`, `description`, `template_type`, `category`, `subject`, `body`, `variables`, `created_by_broker_id`) VALUES
(1, 'Welcome Email', 'Welcome new clients to the loan process', 'email', 'welcome', 'Welcome to Encore Mortgage - Your Loan Application', 'Dear {{client_name}},\n\nWelcome to Encore Mortgage! We\'re excited to help you with your loan application.\n\nYour application ID is: {{application_id}}\n\nNext steps:\n1. Complete all required documents\n2. Schedule your initial consultation\n3. We\'ll review your application within 24-48 hours\n\nIf you have any questions, please don\'t hesitate to contact us.\n\nBest regards,\n{{broker_name}}\nEncore Mortgage', '["client_name", "application_id", "broker_name"]', 1),
(1, 'Document Reminder SMS', 'Remind clients about pending documents', 'sms', 'reminder', NULL, 'Hi {{client_name}}, this is {{broker_name}} from Encore Mortgage. You have {{document_count}} pending documents for your loan application. Please upload them at your earliest convenience. Reply STOP to opt out.', '["client_name", "broker_name", "document_count"]', 1),
(1, 'Application Update WhatsApp', 'Update clients on application status via WhatsApp', 'whatsapp', 'update', NULL, 'Hi {{client_name}} 👋\n\nGreat news! Your loan application status has been updated to: *{{status}}*\n\n{{additional_notes}}\n\nNext steps: {{next_steps}}\n\nFeel free to reply with any questions!\n\n- {{broker_name}} at Encore Mortgage', '["client_name", "status", "additional_notes", "next_steps", "broker_name"]', 1),
(1, 'Loan Approved Email', 'Congratulate clients on loan approval', 'email', 'update', 'Congratulations! Your Loan Has Been Approved', 'Dear {{client_name}},\n\nCongratulations! 🎉\n\nWe\'re thrilled to inform you that your loan application #{{application_id}} has been APPROVED!\n\nLoan Details:\n- Loan Amount: ${{loan_amount}}\n- Interest Rate: {{interest_rate}}%\n- Closing Date: {{closing_date}}\n\nNext Steps:\n1. Review the loan documents we\'ll send shortly\n2. Schedule your closing appointment\n3. Prepare for your new home!\n\nThank you for choosing Encore Mortgage. We\'re excited to be part of your homeownership journey!\n\nBest regards,\n{{broker_name}}\nEncore Mortgage', '["client_name", "application_id", "loan_amount", "interest_rate", "closing_date", "broker_name"]', 1),
(1, 'Quick Update SMS', 'Send quick status updates via SMS', 'sms', 'update', NULL, 'Hi {{client_name}}! Quick update on your loan app #{{application_id}}: {{status_message}}. Questions? Call us! - {{broker_name}} at Encore Mortgage', '["client_name", "application_id", "status_message", "broker_name"]', 1),
(1, 'Document Upload Reminder WhatsApp', 'Friendly WhatsApp reminder for documents', 'whatsapp', 'reminder', NULL, 'Hi {{client_name}} 👋\n\nFriendly reminder: We\'re still waiting for {{missing_documents}} for your loan application.\n\nYou can upload them easily through your client portal: {{portal_link}}\n\nNeed help? Just reply here and I\'ll assist you right away!\n\n📋 Missing: {{missing_documents}}\n⏰ Needed by: {{due_date}}\n\nThanks!\n{{broker_name}} 🏠', '["client_name", "missing_documents", "portal_link", "due_date", "broker_name"]', 1);

-- Create trigger to update conversation_threads when new communication is added
DELIMITER $$

CREATE TRIGGER `update_conversation_thread` AFTER INSERT ON `communications`
FOR EACH ROW
BEGIN
    DECLARE client_name_var VARCHAR(255) DEFAULT NULL;
    DECLARE client_phone_var VARCHAR(20) DEFAULT NULL;
    DECLARE client_email_var VARCHAR(255) DEFAULT NULL;
    
    -- Get client information
    IF NEW.to_user_id IS NOT NULL THEN
        SELECT CONCAT(first_name, ' ', last_name), phone_number, email
        INTO client_name_var, client_phone_var, client_email_var
        FROM clients WHERE id = NEW.to_user_id;
    ELSEIF NEW.from_user_id IS NOT NULL THEN
        SELECT CONCAT(first_name, ' ', last_name), phone_number, email
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
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.body, 200),
        last_message_type = NEW.communication_type,
        message_count = message_count + 1,
        unread_count = unread_count + CASE WHEN NEW.direction = 'inbound' THEN 1 ELSE 0 END,
        updated_at = NOW();
END$$

DELIMITER ;

-- Update existing communications to have conversation_ids
UPDATE communications 
SET conversation_id = CONCAT('conv_', application_id, '_', COALESCE(to_user_id, from_user_id))
WHERE conversation_id IS NULL AND (application_id IS NOT NULL OR to_user_id IS NOT NULL OR from_user_id IS NOT NULL);