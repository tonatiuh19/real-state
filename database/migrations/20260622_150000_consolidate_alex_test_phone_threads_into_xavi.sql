-- Alex Gomez Test (1320015) has no phone but stale SMS threads on 3234756240 (same as Xavi).
-- Consolidate those orphan threads into Xavi Hernandez (420017) and remove the duplicate client.

SET @tenant_id = 1;
SET @source_client_id = 1320015;
SET @target_client_id = 420017;
SET @canonical_conv = CONVERT('conv_client_420017' USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @source_conv = CONVERT('conv_client_1320015' USING utf8mb4) COLLATE utf8mb4_unicode_ci;

UPDATE communications
SET conversation_id = @canonical_conv
WHERE tenant_id = @tenant_id
  AND conversation_id = @source_conv;

UPDATE communications
SET from_user_id = @target_client_id
WHERE tenant_id = @tenant_id AND from_user_id = @source_client_id;

UPDATE communications
SET to_user_id = @target_client_id
WHERE tenant_id = @tenant_id AND to_user_id = @source_client_id;

UPDATE conversation_threads
SET
  client_id = @target_client_id,
  client_name = 'Xavi Hernandez',
  updated_at = NOW()
WHERE tenant_id = @tenant_id
  AND client_id = @source_client_id;

DELETE FROM conversation_threads
WHERE tenant_id = @tenant_id
  AND conversation_id = @source_conv;

DELETE FROM clients
WHERE tenant_id = @tenant_id AND id = @source_client_id;
