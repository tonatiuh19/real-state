-- Migration: Add calendar_events table
-- Date: 2026-04-01
-- Description: Adds a general-purpose calendar_events table for mortgage bankers
--   to track client birthdays, home-purchase anniversaries, realtor anniversaries,
--   important dates, reminders, and other custom calendar items.

CREATE TABLE IF NOT EXISTS `calendar_events` (
  `id`                int           NOT NULL AUTO_INCREMENT,
  `tenant_id`         int           NOT NULL DEFAULT 1,
  `broker_id`         int           DEFAULT NULL COMMENT 'Owning broker (NULL = applies to all)',
  `event_type`        enum(
                        'birthday',
                        'home_anniversary',
                        'realtor_anniversary',
                        'important_date',
                        'reminder',
                        'other'
                      ) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `title`             varchar(255)  COLLATE utf8mb4_unicode_ci NOT NULL,
  `description`       text          COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_date`        date          NOT NULL COMMENT 'The date of the event (or base date for yearly recurrence)',
  `event_time`        time          DEFAULT NULL COMMENT 'Optional time for non-all-day events',
  `all_day`           tinyint       NOT NULL DEFAULT 1,
  `recurrence`        enum('none','yearly') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'none',
  `color`             varchar(30)   COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Optional hex or named color for display',
  `linked_client_id`  int           DEFAULT NULL COMMENT 'Optional FK to clients.id',
  `linked_person_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Free-text contact name (realtor, etc.)',
  `created_at`        timestamp     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        timestamp     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_calendar_events_tenant_broker` (`tenant_id`, `broker_id`),
  KEY `idx_calendar_events_date` (`event_date`),
  KEY `idx_calendar_events_client` (`linked_client_id`),
  CONSTRAINT `fk_calendar_events_broker`  FOREIGN KEY (`broker_id`)         REFERENCES `brokers`  (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_calendar_events_client`  FOREIGN KEY (`linked_client_id`)  REFERENCES `clients`  (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
