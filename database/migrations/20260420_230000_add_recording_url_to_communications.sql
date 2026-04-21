-- Add recording_url column to communications for Twilio call recordings
ALTER TABLE `communications`
  ADD COLUMN `recording_url` VARCHAR(500) DEFAULT NULL
    COMMENT 'Twilio recording URL (mp3) for call communications'
  AFTER `external_id`;

ALTER TABLE `communications`
  ADD COLUMN `recording_duration` INT DEFAULT NULL
    COMMENT 'Recording duration in seconds'
  AFTER `recording_url`;

-- Index for quickly finding recorded calls
ALTER TABLE `communications`
  ADD KEY `idx_communications_recording` (`recording_url`(100));
