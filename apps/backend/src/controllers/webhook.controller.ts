import { NextFunction, Request, Response } from 'express';
import { sendToAirtable } from '../services/airtable.service.js';
import { sendToNotion } from '../services/notion.service.js';
import type { AirtableWebhookRequest, NotionWebhookRequest } from '../schemas/webhook.schema.js';

export async function notionWebhook(
  req: Request<object, object, NotionWebhookRequest>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { integrationToken, databaseId, analysis, metadata } = req.body;
    const result = await sendToNotion(integrationToken, databaseId, analysis, metadata);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function airtableWebhook(
  req: Request<object, object, AirtableWebhookRequest>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { apiKey, baseId, tableName, analysis, metadata } = req.body;
    const result = await sendToAirtable(apiKey, baseId, tableName, analysis, metadata);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
