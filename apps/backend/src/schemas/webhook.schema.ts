import { z } from 'zod';

const analysisSchema = z
  .object({
    matchScore: z.number(),
    confidence: z.enum(['low', 'medium', 'high']),
    summary: z.string(),
    strengths: z.array(z.string()),
    skillGaps: z.array(
      z.object({
        skill: z.string(),
        priority: z.enum(['critical', 'important', 'nice-to-have']),
        context: z.string(),
      }),
    ),
    redFlags: z.array(z.unknown()),
    recommendations: z.array(z.string()),
  })
  .passthrough();

const metadataSchema = z.object({
  company: z.string(),
  jobTitle: z.string().optional(),
});

export const notionWebhookSchema = z.object({
  integrationToken: z.string().min(1),
  databaseId: z.string().min(1),
  analysis: analysisSchema,
  metadata: metadataSchema,
});

export const airtableWebhookSchema = z.object({
  apiKey: z.string().min(1),
  baseId: z.string().min(1),
  tableName: z.string().min(1),
  analysis: analysisSchema,
  metadata: metadataSchema,
});

export type NotionWebhookRequest = z.infer<typeof notionWebhookSchema>;
export type AirtableWebhookRequest = z.infer<typeof airtableWebhookSchema>;
