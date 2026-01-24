import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { WebhookPayload, ParsedMessage } from '../types/whatsapp';
import { sendTextMessage, markAsRead } from '../services/whatsapp.service';

interface WebhookVerifyQuery {
  'hub.mode': string;
  'hub.verify_token': string;
  'hub.challenge': string;
}

function getVerifyToken(): string {
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!token) throw new Error('WHATSAPP_VERIFY_TOKEN is not set');
  return token;
}

function parseWebhookMessage(payload: WebhookPayload): ParsedMessage | null {
  const entry = payload.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  if (!value?.messages?.length || !value?.contacts?.length) {
    return null;
  }

  const message = value.messages[0];
  const contact = value.contacts[0];

  // Only handle text messages for now
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

async function handleIncomingMessage(
  message: ParsedMessage,
  log: FastifyInstance['log']
): Promise<void> {
  log.info({ from: message.from, text: message.text }, 'Received message');

  // Mark message as read
  try {
    await markAsRead(message.messageId);
  } catch (err) {
    log.error({ err }, 'Failed to mark message as read');
  }

  // Echo the message back (placeholder for actual bot logic)
  try {
    await sendTextMessage(
      message.from,
      `Hi ${message.senderName}! I received your message: "${message.text}"\n\nThis bot is under construction.`
    );
  } catch (err) {
    log.error({ err }, 'Failed to send reply');
  }
}

export default async function whatsappRoutes(app: FastifyInstance): Promise<void> {
  // Webhook verification (GET) 
  app.get<{ Querystring: WebhookVerifyQuery }>(
    '/webhook/whatsapp',
    async (request: FastifyRequest<{ Querystring: WebhookVerifyQuery }>, reply: FastifyReply) => {
      const mode = request.query['hub.mode'];
      const token = request.query['hub.verify_token'];
      const challenge = request.query['hub.challenge'];

      if (mode === 'subscribe' && token === getVerifyToken()) {
        app.log.info('Webhook verified successfully');
        return reply.code(200).send(challenge);
      }

      app.log.warn({ mode, token }, 'Webhook verification failed');
      return reply.code(403).send('Forbidden');
    }
  );

  // Webhook receiver (POST) 
  app.post<{ Body: WebhookPayload }>(
    '/webhook/whatsapp',
    async (request: FastifyRequest<{ Body: WebhookPayload }>, reply: FastifyReply) => {
      const payload = request.body;

      // Always respond 200 immediately
      reply.code(200).send('EVENT_RECEIVED');

      if (payload.object !== 'whatsapp_business_account') {
        return;
      }

      const message = parseWebhookMessage(payload);
      if (message) {
        handleIncomingMessage(message, app.log).catch((err) => {
          app.log.error({ err }, 'Error handling message');
        });
      }
    }
  );
}
