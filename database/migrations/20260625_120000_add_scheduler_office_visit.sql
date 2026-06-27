-- Add in-office visit as a scheduler connection method (Encore Mortgage Whittier office).

ALTER TABLE `scheduler_settings`
  ADD COLUMN `allow_office` tinyint(1) NOT NULL DEFAULT '1' AFTER `allow_teams`;

ALTER TABLE `scheduled_meetings`
  MODIFY COLUMN `meeting_type` enum('phone','video','teams','office') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'phone';
