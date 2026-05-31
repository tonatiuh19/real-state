-- Persist the OAuth redirect_uri used at connect time so token refresh always matches Azure AD.

ALTER TABLE `conversation_email_mailboxes`
  ADD COLUMN `oauth_redirect_uri` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL
  COMMENT 'Redirect URI used during OAuth authorize (required for refresh_token grant)'
  AFTER `oauth_expires_at`;
