import { ParsedMessage, WebhookPayload } from "../types/whatsapp";

export function parseWebhookMessage(payload: WebhookPayload): ParsedMessage | null {
  const entry = payload.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  if (!value?.messages?.length || !value?.contacts?.length) {
    return null;
  }

  const message = value.messages[0];
  const contact = value.contacts[0];

  if (message.type !== 'text' || !message.text?.body) {
    return null;
  }

  return {
    messageId: message.id,
    from: message.from,
    senderName: contact.profile.name,
    text: message.text.body,
    timestamp: new Date(parseInt(message.timestamp) * 1000),
  };
}
