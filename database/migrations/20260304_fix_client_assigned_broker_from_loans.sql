-- Fix clients whose assigned_broker_id is NULL but have a loan with a broker_user_id
-- (clients submitted via public partner link before the fix was applied)
UPDATE clients c
INNER JOIN (
  SELECT la.client_user_id, la.broker_user_id
  FROM loan_applications la
  INNER JOIN brokers b ON b.id = la.broker_user_id AND b.role = 'broker'
  WHERE la.broker_user_id IS NOT NULL
  GROUP BY la.client_user_id
) latest ON latest.client_user_id = c.id
SET c.assigned_broker_id = latest.broker_user_id
WHERE c.assigned_broker_id IS NULL
  AND c.tenant_id = 1;
