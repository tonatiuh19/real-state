-- MMS media binary storage
-- Files are stored here so Twilio can fetch them via a public URL with correct Content-Type.
-- The disruptinglabs.com CDN directory is inaccessible for serving (returns HTML catch-all).
-- Files are auto-expired after 24 hours to keep the table small.

CREATE TABLE IF NOT EXISTS mms_media (
  id VARCHAR(36) NOT NULL PRIMARY KEY,        -- UUID v4
  content_type VARCHAR(100) NOT NULL,
  data MEDIUMBLOB NOT NULL,                   -- up to 16 MB; Twilio MMS max is 5 MB
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP  -- actual value set by application
);

CREATE INDEX IF NOT EXISTS idx_mms_media_expires_at ON mms_media (expires_at);
