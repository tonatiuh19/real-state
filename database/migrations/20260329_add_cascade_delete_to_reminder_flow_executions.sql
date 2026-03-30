-- Add ON DELETE CASCADE foreign keys for client_id and loan_application_id
-- on reminder_flow_executions so orphaned rows are cleaned up automatically
-- when a client or loan application is deleted.

ALTER TABLE `reminder_flow_executions`
  ADD CONSTRAINT `fk_executions_client`
    FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_executions_loan`
    FOREIGN KEY (`loan_application_id`) REFERENCES `loan_applications` (`id`) ON DELETE CASCADE;
