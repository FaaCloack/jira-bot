import type { FastifyInstance } from 'fastify';
import type { WebhookPayload } from '../types/whatsapp';
import {
  verifyWebhookController,
  handleWebhookController,
  type WebhookVerifyQuery,
} from '../controllers/whatsapp.controller';

export default async function whatsappRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: WebhookVerifyQuery }>('/webhook/whatsapp', verifyWebhookController);
  app.post<{ Body: WebhookPayload }>('/webhook/whatsapp', handleWebhookController);
}
