import { Bot } from 'grammy';
import { env } from './config/env.js';
import { analyzeForBot } from './services/bot-analyze.service.js';
import { extractTextFromPdf } from './services/pdf.service.js';

interface Session {
  resumeText: string;
  resumeFileName: string;
}

const sessions = new Map<number, Session>();

function getSession(chatId: number): Session {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, { resumeText: '', resumeFileName: '' });
  }
  return sessions.get(chatId)!;
}

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function truncate(text: string, max = 300): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

function formatResult(
  matchScore: number,
  confidence: string,
  summary: string,
  strengths: string[],
  skillGaps: Array<{ skill: string; priority: string }>,
  recommendations: string[],
): string {
  const scoreEmoji = matchScore >= 70 ? '🟢' : matchScore >= 50 ? '🟡' : '🔴';

  const strengthLines = strengths
    .slice(0, 3)
    .map(s => `  • ${esc(s)}`)
    .join('\n');

  const gapLines = skillGaps
    .slice(0, 5)
    .map(g => {
      const dot = g.priority === 'critical' ? '🔴' : g.priority === 'important' ? '🟡' : '🟢';
      return `  ${dot} ${esc(g.skill)}`;
    })
    .join('\n');

  const recLines = recommendations
    .slice(0, 3)
    .map((r, i) => `  ${i + 1}. ${esc(truncate(r, 120))}`)
    .join('\n');

  return [
    `${scoreEmoji} <b>Match Score: ${matchScore}%</b> (${esc(confidence)} confidence)`,
    '',
    `📝 <b>Summary</b>`,
    esc(truncate(summary, 400)),
    '',
    `✅ <b>Strengths</b>`,
    strengthLines || '  —',
    '',
    `⚠️ <b>Skill Gaps</b>`,
    gapLines || '  None identified',
    '',
    `💡 <b>Recommendations</b>`,
    recLines || '  —',
  ].join('\n');
}

const WELCOME = `👋 <b>AI Job Application Analyzer</b>

How to use:
1️⃣ Send your resume as a <b>PDF file</b>
2️⃣ Paste a <b>job posting</b> as text
3️⃣ Get an instant match analysis ✨

Commands:
/resume — check resume status
/clear — clear your resume
/help — show this message`;

export function createBot(): Bot {
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

  bot.command(['start', 'help'], async ctx => {
    await ctx.reply(WELCOME, { parse_mode: 'HTML' });
  });

  bot.command('resume', async ctx => {
    const session = getSession(ctx.chat.id);
    if (session.resumeText) {
      await ctx.reply(
        `✅ Resume loaded: <b>${esc(session.resumeFileName)}</b>\n\nPaste a job posting to analyze.`,
        { parse_mode: 'HTML' },
      );
    } else {
      await ctx.reply('❌ No resume loaded. Send a PDF file to set your resume.');
    }
  });

  bot.command('clear', async ctx => {
    sessions.delete(ctx.chat.id);
    await ctx.reply('🗑️ Resume cleared.');
  });

  // PDF upload → extract and store resume
  bot.on('message:document', async ctx => {
    const doc = ctx.message.document;
    if (doc.mime_type !== 'application/pdf') {
      await ctx.reply('❌ Please send a PDF file.');
      return;
    }

    const status = await ctx.reply('📄 Processing your resume…');

    try {
      const file = await ctx.getFile();
      const fileUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
      const res = await fetch(fileUrl);
      const buffer = Buffer.from(await res.arrayBuffer());

      const text = await extractTextFromPdf(buffer);
      const session = getSession(ctx.chat.id);
      session.resumeText = text;
      session.resumeFileName = doc.file_name ?? 'resume.pdf';

      await ctx.api.editMessageText(
        ctx.chat.id,
        status.message_id,
        `✅ Resume loaded: <b>${esc(session.resumeFileName)}</b>\n\nNow paste a job posting to analyze.`,
        { parse_mode: 'HTML' },
      );
    } catch {
      await ctx.api.editMessageText(
        ctx.chat.id,
        status.message_id,
        '❌ Failed to read PDF. Make sure it contains extractable text.',
      );
    }
  });

  // Text message → analyze as job posting
  bot.on('message:text', async ctx => {
    const text = ctx.message.text;
    if (text.startsWith('/')) return;

    const session = getSession(ctx.chat.id);

    if (!session.resumeText) {
      await ctx.reply('❌ No resume loaded. Send a PDF file first.');
      return;
    }

    if (text.length < 100) {
      await ctx.reply('⚠️ Job posting seems too short. Paste the full job description.');
      return;
    }

    const status = await ctx.reply('🔍 Analyzing… this takes ~30 seconds.');

    try {
      const result = await analyzeForBot(session.resumeText, text);

      const message = formatResult(
        result.matchScore,
        result.confidence,
        result.summary,
        result.strengths,
        result.skillGaps,
        result.recommendations,
      );

      await ctx.api.editMessageText(ctx.chat.id, status.message_id, message, {
        parse_mode: 'HTML',
      });
    } catch {
      await ctx.api.editMessageText(
        ctx.chat.id,
        status.message_id,
        '❌ Analysis failed. Please try again.',
      );
    }
  });

  bot.catch(err => {
    console.error(`[Bot] update ${err.ctx.update.update_id}:`, err.error);
  });

  return bot;
}
