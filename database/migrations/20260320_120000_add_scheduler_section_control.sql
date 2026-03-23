-- Migration: Add scheduler section to admin_section_controls
-- Date: 2026-03-20
-- Description: Registers the new Scheduler admin sidebar section so it can be
--              toggled enabled/disabled from the Settings panel like all other sections.

INSERT IGNORE INTO `admin_section_controls` (`tenant_id`, `section_id`, `is_disabled`, `tooltip_message`)
VALUES (1, 'scheduler', 0, 'Coming Soon');
