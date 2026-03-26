import { AppError } from '../middleware/error.middleware.js';
import type { AirtableWebhookRequest } from '../schemas/webhook.schema.js';

type Analysis = AirtableWebhookRequest['analysis'];

export async function sendToAirtable(
  apiKey: string,
  baseId: string,
  tableName: string,
  analysis: Analysis,
  metadata: { company: string; jobTitle?: string },
): Promise<{ id: string }> {
  const skillGapsText = analysis.skillGaps
    .map(g => `[${g.priority}] ${g.skill}: ${g.context}`)
    .join('\n');

  const fields: Record<string, unknown> = {
    Company: metadata.company,
    'Match Score': analysis.matchScore,
    Date: new Date().toISOString().split('T')[0],
    Summary: analysis.summary,
    Status: 'Applied',
    'Skill Gaps': skillGapsText,
    Recommendations: analysis.recommendations.join('\n'),
  };

  if (metadata.jobTitle) {
    fields['Job Title'] = metadata.jobTitle;
  }

  const res = await fetch(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields, typecast: true }),
    },
  );

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      error?: { message?: string; type?: string };
    };
    if (res.status === 401) throw new AppError(401, 'Invalid Airtable API key.');
    if (res.status === 404)
      throw new AppError(404, 'Airtable base or table not found. Check Base ID and table name.');
    throw new AppError(400, err.error?.message ?? 'Failed to create Airtable record.');
  }

  const record = (await res.json()) as { id: string };
  return { id: record.id };
}
