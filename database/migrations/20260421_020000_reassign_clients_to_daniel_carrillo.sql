-- Migration: Reassign tenant 1 clients to Daniel Carrillo while preserving Alex Gomez test ownership
-- Safe to re-run: updates only clients that are not already assigned to Alex or Daniel.

SET @daniel_id = (
  SELECT id
  FROM brokers
  WHERE tenant_id = 1
    AND first_name = 'Daniel'
    AND last_name = 'Carrillo'
    AND role = 'admin'
    AND status = 'active'
  LIMIT 1
);

SET @alex_id = (
  SELECT id
  FROM brokers
  WHERE tenant_id = 1
    AND first_name = 'Alex'
    AND last_name = 'Gomez'
    AND role = 'admin'
    AND status = 'active'
  LIMIT 1
);

-- Abort with a clear error if either required broker record cannot be found.
SELECT IF(
  @daniel_id IS NULL OR @alex_id IS NULL,
  (SELECT 1 FROM information_schema.tables WHERE 1/0),
  CONCAT('daniel=', @daniel_id, ', alex=', @alex_id)
) AS broker_assignment_check;

UPDATE clients
SET
  assigned_broker_id = @daniel_id,
  updated_at = NOW()
WHERE tenant_id = 1
  AND (
    assigned_broker_id IS NULL
    OR (assigned_broker_id <> @alex_id AND assigned_broker_id <> @daniel_id)
  );

SELECT
  CONCAT(
    'Reassigned ',
    ROW_COUNT(),
    ' client(s) to Daniel Carrillo (id=',
    @daniel_id,
    ') while preserving Alex Gomez (id=',
    @alex_id,
    ').'
  ) AS result;
