-- Migration: Cascade delete conversation_threads when a client is deleted
-- Previously: ON DELETE SET NULL (threads were orphaned with NULL client_id)
-- After: ON DELETE CASCADE (threads are deleted along with the client)
-- NOTE: Already applied. If re-running, skip if DELETE_RULE is already CASCADE.

ALTER TABLE `conversation_threads`
  DROP FOREIGN KEY `fk_conversation_threads_client`;

ALTER TABLE `conversation_threads`
  ADD CONSTRAINT `fk_conversation_threads_client_v2`
    FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;
