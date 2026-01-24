import type {
  SendTextMessageRequest,
  MarkAsReadRequest,
  SendMessageResponse,
} from '../types/whatsapp';

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

function getPhoneNumberId(): string {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!id) throw new Error('WHATSAPP_PHONE_NUMBER_ID is not set');
  return id;
}

function getAccessToken(): string {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error('WHATSAPP_ACCESS_TOKEN is not set');
  return token;
}

function getMessagesUrl(): string {
  return `${GRAPH_API_BASE}/${getPhoneNumberId()}/messages`;
}

async function callGraphApi<T>(
  url: string,
  body: object
): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WhatsApp API error: ${response.status} - ${error}`);
  }

  return response.json() as Promise<T>;
}

export async function sendTextMessage(
  to: string,
  body: string
): Promise<SendMessageResponse> {
  const payload: SendTextMessageRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: {
      preview_url: false,
      body,
    },
  };

  return callGraphApi<SendMessageResponse>(getMessagesUrl(), payload);
}

export async function markAsRead(messageId: string): Promise<void> {
  const payload: MarkAsReadRequest = {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
  };

  await callGraphApi(getMessagesUrl(), payload);
}
