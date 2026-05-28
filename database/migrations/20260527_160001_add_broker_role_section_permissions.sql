-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add broker_role_section_permissions table
-- Date: 2026-05-27
-- ─────────────────────────────────────────────────────────────────────────────
-- Provides per-role sidebar visibility control for the platform.
-- platform_owner users always see everything regardless of this table.
-- This table controls what admin (Mortgage Banker) and broker (Partner) roles
-- can see in the sidebar — configurable by platform_owner from Settings.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS broker_role_section_permissions (
  id          INT          NOT NULL AUTO_INCREMENT,
  tenant_id   INT          NOT NULL DEFAULT 1,
  broker_role ENUM('admin','broker') NOT NULL,
  section_id  VARCHAR(100) NOT NULL,
  is_visible  TINYINT(1)   NOT NULL DEFAULT 1,
  updated_by  INT          NULL COMMENT 'platform_owner broker_id who last changed this',
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                           ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_role_section (tenant_id, broker_role, section_id),
  CONSTRAINT fk_brsp_tenant  FOREIGN KEY (tenant_id) REFERENCES tenants(id)   ON DELETE CASCADE,
  CONSTRAINT fk_brsp_updater FOREIGN KEY (updated_by) REFERENCES brokers(id) ON DELETE SET NULL
);

-- ── Seed defaults for tenant 1 ───────────────────────────────────────────────
-- admin (Mortgage Banker): visible sections
INSERT INTO broker_role_section_permissions (tenant_id, broker_role, section_id, is_visible) VALUES
  (1, 'admin', 'dashboard',                 1),
  (1, 'admin', 'pipeline',                  1),
  (1, 'admin', 'clients',                   1),
  (1, 'admin', 'tasks',                     1),
  (1, 'admin', 'documents',                 1),
  (1, 'admin', 'scheduler',                 1),
  (1, 'admin', 'conversations',             1),
  (1, 'admin', 'email',                     1),
  (1, 'admin', 'reports',                   1),
  (1, 'admin', 'settings',                  1),
  (1, 'admin', 'income-calculator',         1),
  (1, 'admin', 'mortgi',                    1),
  -- platform_owner exclusive (hidden for admin by default)
  (1, 'admin', 'reminder-flows',            0),
  (1, 'admin', 'communication-templates',   0),
  (1, 'admin', 'brokers',                   0),
-- broker (Partner Realtor): visible sections
  (1, 'broker', 'dashboard',               1),
  (1, 'broker', 'pipeline',                1),
  (1, 'broker', 'clients',                 1),
  (1, 'broker', 'scheduler',               1),
  (1, 'broker', 'income-calculator',       1),
  (1, 'broker', 'mortgi',                  1),
  -- hidden for broker
  (1, 'broker', 'tasks',                   0),
  (1, 'broker', 'documents',               0),
  (1, 'broker', 'conversations',           0),
  (1, 'broker', 'email',                   0),
  (1, 'broker', 'reports',                 0),
  (1, 'broker', 'settings',                0),
  (1, 'broker', 'reminder-flows',          0),
  (1, 'broker', 'communication-templates', 0),
  (1, 'broker', 'brokers',                 0);
