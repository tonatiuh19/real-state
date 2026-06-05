-- Add per-client SMS broadcast consent flag.
-- Policy:
--   - 0   => explicitly opted out (STOP)
--   - 1   => explicitly opted in (START/UNSTOP or admin set)
--   - NULL => legacy/unknown; currently treated as allowed for broadcast sends
--            to avoid blocking existing business operations.

ALTER TABLE clients
ADD COLUMN sms_blast_opted_in TINYINT(1) NULL DEFAULT NULL
  COMMENT 'SMS broadcast consent: 0 opted out, 1 opted in, NULL legacy unknown';

CREATE INDEX idx_clients_tenant_sms_blast_opted_in
  ON clients (tenant_id, sms_blast_opted_in);
