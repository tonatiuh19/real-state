-- Short links + durable link assets for Broadcast SMS (portal.encoremortgage.org/l/…)
-- Optional MMS media columns on realtor_broadcasts (capped audiences only).
-- Note: TiDB/MySQL do not support ADD COLUMN IF NOT EXISTS here.

CREATE TABLE IF NOT EXISTS `link_assets` (
  `id`            VARCHAR(36) NOT NULL,
  `tenant_id`     INT NOT NULL,
  `created_by`    INT NOT NULL,
  `content_type`  VARCHAR(100) NOT NULL,
  `filename`      VARCHAR(255) DEFAULT NULL,
  `byte_size`     INT NOT NULL DEFAULT 0,
  `data`          LONGBLOB NOT NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_link_assets_tenant` (`tenant_id`),
  CONSTRAINT `fk_link_assets_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_link_assets_broker` FOREIGN KEY (`created_by`) REFERENCES `brokers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `short_links` (
  `id`              INT NOT NULL AUTO_INCREMENT,
  `tenant_id`       INT NOT NULL,
  `created_by`      INT NOT NULL,
  `code`            VARCHAR(16) NOT NULL,
  `target_url`      TEXT NOT NULL,
  `title`           VARCHAR(255) DEFAULT NULL,
  `asset_id`        VARCHAR(36) DEFAULT NULL,
  `broadcast_id`    INT DEFAULT NULL,
  `click_count`     INT NOT NULL DEFAULT 0,
  `last_clicked_at` DATETIME DEFAULT NULL,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_short_links_code` (`code`),
  KEY `idx_short_links_tenant` (`tenant_id`),
  KEY `idx_short_links_broadcast` (`broadcast_id`),
  CONSTRAINT `fk_short_links_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_short_links_broker` FOREIGN KEY (`created_by`) REFERENCES `brokers`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_short_links_asset` FOREIGN KEY (`asset_id`) REFERENCES `link_assets`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_short_links_broadcast` FOREIGN KEY (`broadcast_id`) REFERENCES `realtor_broadcasts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `realtor_broadcasts`
  ADD COLUMN `media_url` TEXT DEFAULT NULL COMMENT 'Optional MMS media for small SMS blasts'
  AFTER `body_sms`;

ALTER TABLE `realtor_broadcasts`
  ADD COLUMN `media_content_type` VARCHAR(100) DEFAULT NULL
  AFTER `media_url`;

ALTER TABLE `realtor_broadcasts`
  ADD COLUMN `media_filename` VARCHAR(255) DEFAULT NULL
  AFTER `media_content_type`;

ALTER TABLE `realtor_broadcasts`
  ADD COLUMN `short_link_code` VARCHAR(16) DEFAULT NULL
  AFTER `media_filename`;
