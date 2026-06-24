-- Permanently delete failed test group "Grupo Test" and all related rows.

SET @tenant_id = 1;
SET @conv = CONVERT('conv_group_4fe44b97625d4b55' USING utf8mb4) COLLATE utf8mb4_unicode_ci;

DELETE FROM communications
WHERE tenant_id = @tenant_id AND conversation_id = @conv;

DELETE FROM conversation_participants
WHERE tenant_id = @tenant_id AND conversation_id = @conv;

DELETE FROM conversation_threads
WHERE tenant_id = @tenant_id AND conversation_id = @conv;
