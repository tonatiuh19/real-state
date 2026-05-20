-- Migration: Strip HTML from existing notification messages
-- Notifications created before the createBrokerNotification HTML-strip fix
-- may contain raw HTML from email bodies. This cleans them up.
--
-- Uses two-pass REGEXP_REPLACE (TiDB/MySQL 8 compatible):
--   1. Remove any complete HTML tags <...>
--   2. Collapse excess whitespace
-- Note: Incomplete tags (no closing >) at end of string cannot be removed
--       by MySQL REGEXP_REPLACE without lookaheads; the client-side stripHtml
--       utility handles those with /<[^>]*$/ after fetching from DB.

UPDATE notifications
SET message = TRIM(
  REGEXP_REPLACE(
    REGEXP_REPLACE(message, '<[^>]*>', ' '),
    '\\s+',
    ' '
  )
)
WHERE message LIKE '%<%';
