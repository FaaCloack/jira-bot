import type { ParsedMessage } from '../types/whatsapp';
import { sendTextMessage, markAsRead } from '../services/whatsapp.service';
import { Logger } from '../types/common';

export async function handleIncomingMessage(
  message: ParsedMessage,
  log: Logger
): Promise<void> {
  log.info({ from: message.from, text: message.text }, 'Received message');

  try {
    await markAsRead(message.messageId);
  } catch (err) {
    log.error({ err }, 'Failed to mark message as read');
  }

  try {
    await sendTextMessage(
      message.from,
      `Hi ${message.senderName}! I received your message: "${message.text}"\n\nThis bot is under construction.`
    );
  } catch (err) {
    log.error({ err }, 'Failed to send reply');
  }
}

export function verifyWebhook(mode: string, token: string): boolean {
  return mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN;
}
