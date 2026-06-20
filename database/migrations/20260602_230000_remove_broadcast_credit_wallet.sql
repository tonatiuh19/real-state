-- Remove legacy USD broadcast wallet (replaced by unified QuotaService)

DROP TABLE IF EXISTS tenant_broadcast_credit_ledger;
DROP TABLE IF EXISTS tenant_broadcast_credits;
