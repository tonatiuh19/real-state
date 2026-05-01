-- P1-3: JWT revocation table
-- Tracks JWT IDs (jti) that have been explicitly revoked (e.g., on logout)
-- so a stolen token cannot be used until its natural expiry.

CREATE TABLE IF NOT EXISTS `revoked_tokens` (
  `jti` VARCHAR(36) NOT NULL,
  `user_type` ENUM('client', 'broker') NOT NULL,
  `user_id` BIGINT NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `revoked_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`jti`),
  KEY `idx_revoked_tokens_expires_at` (`expires_at`),
  KEY `idx_revoked_tokens_user` (`user_type`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
