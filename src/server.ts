import 'dotenv/config';
import Fastify from 'fastify';
import whatsappRoutes from './routes/whatsapp';

const requiredEnvVars = [
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_VERIFY_TOKEN',
  'JIRA_BASE_URL',
  'JIRA_EMAIL',
  'JIRA_API_TOKEN',
  'JIRA_PROJECT_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const port = Number(process.env.PORT) || 3000;
const app = Fastify({ logger: true });

app.get('/health', async () => ({ status: 'ok' }));
app.register(whatsappRoutes);

app.listen({ port: port, host: '0.0.0.0' }, err => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
