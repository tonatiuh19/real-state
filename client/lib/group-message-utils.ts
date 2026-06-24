import type { Communication } from "@shared/api";

/** Resolve inbound sender label for group threads. */
export function getGroupInboundSenderName(message: Communication): string | null {
  if (message.direction === "outbound") return null;
  const sender = (message as Communication & { sender_name?: string }).sender_name;
  if (sender && sender !== "System") return sender;
  const meta = message.metadata as { from_display_name?: string } | null | undefined;
  if (meta?.from_display_name?.trim()) return meta.from_display_name.trim();
  return null;
}

/** Delivery hint for group MMS outbound messages. */
export function getGroupDeliveryHint(message: Communication): string | null {
  if (message.direction !== "outbound") return null;
  const meta = message.metadata as {
    delivery?: { error?: string | null; recipient_count?: number };
    is_group_mms?: boolean;
  } | null;
  if (message.delivery_status === "failed" || message.delivery_status === "rejected") {
    return (
      meta?.delivery?.error ||
      message.error_message ||
      "Delivery failed for one or more recipients"
    );
  }
  if (meta?.is_group_mms && meta.delivery?.recipient_count) {
    return `Sent to ${meta.delivery.recipient_count} recipients`;
  }
  return null;
}
