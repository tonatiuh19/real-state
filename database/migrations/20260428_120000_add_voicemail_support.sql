-- =====================================================================
-- Voicemail support for inbound calls
-- =====================================================================
-- When inbound calls aren't answered (no-answer / busy / failed / canceled)
-- Twilio's <Dial action=...> callback now redirects the caller to a
-- voicemail flow that:
--   1) plays a greeting (custom MP3 URL, or TTS of greeting_text, or default)
--   2) records up to voicemail_max_seconds of audio
--   3) optionally transcribes the recording
--
-- Settings live at TWO levels:
--   • tenants.*           → fallback for shared lines and brokers without overrides
--   • brokers.*           → personal-line override for a specific banker
--
-- Recordings are stored in `communications` with `is_voicemail = 1`.
-- =====================================================================

-- ───────────────────────────── tenants ─────────────────────────────
ALTER TABLE `tenants`
  ADD COLUMN `voicemail_enabled` TINYINT(1) NOT NULL DEFAULT 1
    COMMENT '1 = unanswered inbound calls fall back to voicemail',
  ADD COLUMN `voicemail_greeting_text` TEXT
    COMMENT 'Text-to-speech greeting (used when voicemail_greeting_url is NULL)',
  ADD COLUMN `voicemail_greeting_url` VARCHAR(500)
    COMMENT 'Public MP3/WAV URL of pre-recorded greeting (overrides greeting_text)',
  ADD COLUMN `voicemail_max_seconds` INT NOT NULL DEFAULT 120
    COMMENT 'Maximum voicemail length in seconds (Twilio caps at 3600)',
  ADD COLUMN `voicemail_transcribe` TINYINT(1) NOT NULL DEFAULT 1
    COMMENT '1 = ask Twilio to transcribe voicemails (small per-minute fee)';

-- ───────────────────────────── brokers ─────────────────────────────
ALTER TABLE `brokers`
  ADD COLUMN `voicemail_enabled` TINYINT(1) DEFAULT NULL
    COMMENT 'NULL = inherit tenant; 1/0 = override for this banker''s personal line',
  ADD COLUMN `voicemail_greeting_text` TEXT
    COMMENT 'Text-to-speech greeting override for this banker',
  ADD COLUMN `voicemail_greeting_url` VARCHAR(500)
    COMMENT 'Pre-recorded greeting MP3/WAV URL override for this banker';

-- ───────────────────────── communications ──────────────────────────
ALTER TABLE `communications`
  ADD COLUMN `is_voicemail` TINYINT(1) NOT NULL DEFAULT 0
    COMMENT '1 = this call communication is an unanswered-call voicemail',
  ADD COLUMN `voicemail_transcription` TEXT
    COMMENT 'Twilio-generated transcript of the voicemail recording';

ALTER TABLE `communications`
  ADD KEY `idx_communications_voicemail` (`tenant_id`, `is_voicemail`, `created_at`);
