-- Stripe webhook event.id deduplication (Stripe retries up to ~3 days).

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id    VARCHAR(255) NOT NULL,
  event_type  VARCHAR(100) NOT NULL,
  processed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id),
  KEY idx_swe_processed (processed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
