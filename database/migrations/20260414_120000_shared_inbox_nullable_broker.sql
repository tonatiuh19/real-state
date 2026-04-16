-- Migration: Allow conversation_threads.broker_id to be NULL
-- This enables a shared inbox — inbound messages from unknown numbers on shared
-- Twilio numbers (no assigned owner) are visible to ALL brokers until one claims
-- the thread by replying first.

ALTER TABLE conversation_threads
  MODIFY COLUMN broker_id INT(11) NULL DEFAULT NULL;
