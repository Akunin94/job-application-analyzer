import { Router } from 'express';
import { airtableWebhook, notionWebhook } from '../controllers/webhook.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { airtableWebhookSchema, notionWebhookSchema } from '../schemas/webhook.schema.js';

export const webhookRouter: Router = Router();

webhookRouter.post('/notion', validate(notionWebhookSchema), notionWebhook);
webhookRouter.post('/airtable', validate(airtableWebhookSchema), airtableWebhook);
