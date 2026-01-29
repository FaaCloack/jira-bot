import type { FastifyRequest, FastifyReply } from 'fastify';
import type { WebhookPayload } from '../types/whatsapp';
import { verifyWebhook, handleIncomingMessage } from '../usecases/whatsapp.usecase';
import { parseWebhookMessage } from '../usecases/whatsapp.parsers';
import { logger } from '../utils/logger';

export interface WebhookVerifyQuery {
  'hub.mode': string;
  'hub.verify_token': string;
  'hub.challenge': string;
}

export async function verifyWebhookController(
  request: FastifyRequest<{ Querystring: WebhookVerifyQuery }>,
  reply: FastifyReply
): Promise<void> {
  const mode = request.query['hub.mode'];
  const token = request.query['hub.verify_token'];
  const challenge = request.query['hub.challenge'];

  if (verifyWebhook(mode, token)) {
    logger.info('Webhook verified successfully');
    reply.code(200).send(challenge);
    return;
  }

  logger.warn({ mode, token }, 'Webhook verification failed');
  reply.code(403).send('Forbidden');
}

export async function handleWebhookController(
  request: FastifyRequest<{ Body: WebhookPayload }>,
  reply: FastifyReply
): Promise<void> {
  const payload = request.body;

  reply.code(200).send('EVENT_RECEIVED');

  if (payload.object !== 'whatsapp_business_account') {
    return;
  }

  const message = parseWebhookMessage(payload);
  if (message) {
    handleIncomingMessage(message).catch((err) => {
      logger.error({ err }, 'Error handling message');
    });
  }
}
