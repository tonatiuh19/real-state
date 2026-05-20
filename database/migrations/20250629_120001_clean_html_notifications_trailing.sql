-- Migration: Strip trailing incomplete HTML tags from notification messages
-- Follow-up to 20250629_120000_clean_html_notifications.sql
-- Handles truncated messages like "<div name=\"messageBodySect" (no closing >)
-- by removing from the last '<' to end of string, then stripping any remaining
-- complete tags and collapsing whitespace.

UPDATE notifications
SET message = TRIM(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(message, '<[^>]*$', ''),
      '<[^>]*>',
      ' '
    ),
    '\\s+',
    ' '
  )
)
WHERE message LIKE '%<%';

-- For rows that are now empty or whitespace-only after stripping, replace with a placeholder
UPDATE notifications
SET message = '(email preview)'
WHERE TRIM(message) = '' AND category IN ('message', 'email', 'communication');
