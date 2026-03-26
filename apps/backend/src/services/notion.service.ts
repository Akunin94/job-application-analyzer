import { AppError } from '../middleware/error.middleware.js';
import type { NotionWebhookRequest } from '../schemas/webhook.schema.js';

type Analysis = NotionWebhookRequest['analysis'];

const NOTION_VERSION = '2022-06-28';

function notionHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION_VERSION,
  };
}

function rt(content: string) {
  return [{ text: { content } }];
}

function buildBlocks(analysis: Analysis): object[] {
  const blocks: object[] = [];

  // Match score callout
  const emoji = analysis.matchScore >= 70 ? '✅' : analysis.matchScore >= 50 ? '⚠️' : '❌';
  blocks.push({
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: rt(`Match Score: ${analysis.matchScore}% · Confidence: ${analysis.confidence}`),
      icon: { emoji },
      color: 'default',
    },
  });

  // Summary
  if (analysis.summary) {
    blocks.push({ object: 'block', type: 'heading_2', heading_2: { rich_text: rt('Summary') } });
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: rt(analysis.summary) },
    });
  }

  // Strengths
  if (analysis.strengths.length) {
    blocks.push({
      object: 'block',
      type: 'heading_3',
      heading_3: { rich_text: rt('Strengths') },
    });
    for (const s of analysis.strengths.slice(0, 10)) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: rt(s) },
      });
    }
  }

  // Skill Gaps
  if (analysis.skillGaps.length) {
    blocks.push({
      object: 'block',
      type: 'heading_3',
      heading_3: { rich_text: rt('Skill Gaps') },
    });
    for (const gap of analysis.skillGaps.slice(0, 10)) {
      const dot = gap.priority === 'critical' ? '🔴' : gap.priority === 'important' ? '🟡' : '🟢';
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: rt(`${dot} ${gap.skill} — ${gap.context}`) },
      });
    }
  }

  // Recommendations
  if (analysis.recommendations.length) {
    blocks.push({
      object: 'block',
      type: 'heading_3',
      heading_3: { rich_text: rt('Recommendations') },
    });
    for (const rec of analysis.recommendations.slice(0, 10)) {
      blocks.push({
        object: 'block',
        type: 'numbered_list_item',
        numbered_list_item: { rich_text: rt(rec) },
      });
    }
  }

  return blocks;
}

export async function sendToNotion(
  token: string,
  databaseId: string,
  analysis: Analysis,
  metadata: { company: string; jobTitle?: string },
): Promise<{ url: string }> {
  // Fetch database schema to find the title property name
  const dbRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
    headers: notionHeaders(token),
  });

  if (!dbRes.ok) {
    if (dbRes.status === 401) throw new AppError(401, 'Invalid Notion integration token.');
    if (dbRes.status === 403)
      throw new AppError(
        403,
        'Integration does not have access to this database. Share the database with your integration.',
      );
    if (dbRes.status === 404) throw new AppError(404, 'Notion database not found.');
    throw new AppError(400, 'Failed to access Notion database.');
  }

  const db = (await dbRes.json()) as { properties: Record<string, { type: string }> };

  const titlePropName =
    Object.entries(db.properties).find(([, p]) => p.type === 'title')?.[0] ?? 'Name';

  const pageTitle = [metadata.company, metadata.jobTitle].filter(Boolean).join(' — ');

  // Build properties — only set what actually exists in the schema
  const properties: Record<string, unknown> = {
    [titlePropName]: {
      title: rt(`${pageTitle} — ${analysis.matchScore}% match`),
    },
  };

  if (db.properties.Status?.type === 'select') {
    properties.Status = { select: { name: 'Applied' } };
  }
  if (db.properties['Match Score']?.type === 'number') {
    properties['Match Score'] = { number: analysis.matchScore };
  }
  if (db.properties.Date?.type === 'date') {
    properties.Date = { date: { start: new Date().toISOString().split('T')[0] } };
  }
  if (db.properties.Company?.type === 'rich_text') {
    properties.Company = { rich_text: rt(metadata.company) };
  }

  const pageRes = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: notionHeaders(token),
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
      children: buildBlocks(analysis),
    }),
  });

  if (!pageRes.ok) {
    const err = (await pageRes.json().catch(() => ({}))) as { message?: string };
    throw new AppError(400, err.message ?? 'Failed to create Notion page.');
  }

  const page = (await pageRes.json()) as { url: string };
  return { url: page.url };
}
