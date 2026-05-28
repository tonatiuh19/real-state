-- Add media_filename column to communications table
-- Stores the original filename of MMS attachments (e.g. "contract.pdf")
-- so the UI can display it instead of a generic label.
ALTER TABLE communications
  ADD COLUMN media_filename VARCHAR(255) DEFAULT NULL
    COMMENT 'Original filename of the MMS media attachment (e.g. contract.pdf)'
    AFTER media_content_type;
