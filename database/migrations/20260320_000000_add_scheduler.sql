-- =====================================================
-- SCHEDULER SYSTEM
-- Adds scheduler_settings, scheduler_availability, and scheduled_meetings tables
-- Compatible with MySQL 8.0
-- =====================================================

-- Per-broker scheduler configuration
CREATE TABLE IF NOT EXISTS scheduler_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL DEFAULT 1,
  broker_id INT NOT NULL,
  is_enabled TINYINT(1) NOT NULL DEFAULT 1,
  meeting_title VARCHAR(255) NOT NULL DEFAULT 'Mortgage Consultation',
  meeting_description TEXT,
  slot_duration_minutes INT NOT NULL DEFAULT 30,
  buffer_time_minutes INT NOT NULL DEFAULT 15,
  advance_booking_days INT NOT NULL DEFAULT 30,
  min_booking_hours INT NOT NULL DEFAULT 2,
  timezone VARCHAR(100) NOT NULL DEFAULT 'America/Chicago',
  allow_phone TINYINT(1) NOT NULL DEFAULT 1,
  allow_video TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_scheduler_broker (tenant_id, broker_id),
  CONSTRAINT fk_scheduler_settings_broker FOREIGN KEY (broker_id)
    REFERENCES brokers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Weekly availability windows (repeating schedule)
CREATE TABLE IF NOT EXISTS scheduler_availability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL DEFAULT 1,
  broker_id INT NOT NULL,
  day_of_week TINYINT NOT NULL COMMENT '0=Sunday,1=Monday,...,6=Saturday',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_availability_broker_day (broker_id, day_of_week),
  CONSTRAINT fk_scheduler_availability_broker FOREIGN KEY (broker_id)
    REFERENCES brokers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Booked meetings
CREATE TABLE IF NOT EXISTS scheduled_meetings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL DEFAULT 1,
  broker_id INT,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50),
  meeting_date DATE NOT NULL,
  meeting_time TIME NOT NULL,
  meeting_end_time TIME NOT NULL,
  meeting_type ENUM('phone', 'video') NOT NULL DEFAULT 'phone',
  jitsi_room_id VARCHAR(255) COMMENT 'Auto-generated unique Jitsi room name for video calls',
  status ENUM('pending','confirmed','cancelled','completed','no_show') NOT NULL DEFAULT 'confirmed',
  notes TEXT COMMENT 'Notes from the client at booking time',
  broker_notes TEXT COMMENT 'Private notes from the broker',
  booking_token VARCHAR(255) NOT NULL COMMENT 'UUID for client self-cancellation',
  public_token VARCHAR(255) COMMENT 'Broker public_token used to make the booking (brokers.public_token)',
  cancelled_reason TEXT,
  cancelled_by ENUM('client','broker'),
  cancelled_at TIMESTAMP NULL DEFAULT NULL,
  reminder_24h_sent_at TIMESTAMP NULL DEFAULT NULL,
  reminder_1h_sent_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_meetings_broker_date (broker_id, meeting_date),
  INDEX idx_meetings_booking_token (booking_token),
  INDEX idx_meetings_status (status),
  CONSTRAINT fk_scheduled_meetings_broker FOREIGN KEY (broker_id)
    REFERENCES brokers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default scheduler settings for all existing active brokers
INSERT IGNORE INTO scheduler_settings (tenant_id, broker_id, is_enabled, meeting_title, meeting_description, slot_duration_minutes, buffer_time_minutes, advance_booking_days, min_booking_hours, timezone, allow_phone, allow_video)
SELECT
  b.tenant_id,
  b.id,
  1,
  'Mortgage Consultation',
  'Schedule a free consultation with our mortgage expert. We''ll discuss your goals and walk you through your best loan options.',
  30,
  15,
  30,
  2,
  'America/Chicago',
  1,
  1
FROM brokers b
WHERE b.status = 'active';

-- Seed default Mon-Fri 9am-5pm availability for all existing active brokers
INSERT IGNORE INTO scheduler_availability (tenant_id, broker_id, day_of_week, start_time, end_time, is_active)
SELECT b.tenant_id, b.id, 1, '09:00:00', '17:00:00', 1 FROM brokers b WHERE b.status = 'active'
UNION ALL
SELECT b.tenant_id, b.id, 2, '09:00:00', '17:00:00', 1 FROM brokers b WHERE b.status = 'active'
UNION ALL
SELECT b.tenant_id, b.id, 3, '09:00:00', '17:00:00', 1 FROM brokers b WHERE b.status = 'active'
UNION ALL
SELECT b.tenant_id, b.id, 4, '09:00:00', '17:00:00', 1 FROM brokers b WHERE b.status = 'active'
UNION ALL
SELECT b.tenant_id, b.id, 5, '09:00:00', '17:00:00', 1 FROM brokers b WHERE b.status = 'active';
