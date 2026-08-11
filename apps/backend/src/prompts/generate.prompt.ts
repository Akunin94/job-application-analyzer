import { AnalysisResult, GenerateTarget } from '../schemas/analyze.schema.js';

export const SECTION_MARKER = {
  resume: '<<<SECTION:resume>>>',
  coverLetter: '<<<SECTION:cover_letter>>>',
  companyEmail: '<<<SECTION:company_email>>>',
  hrMessage: '<<<SECTION:hr_message>>>',
} as const satisfies Record<GenerateTarget, string>;

export const END_MARKER = '<<<END>>>';

const RESUME_SPEC = `${SECTION_MARKER.resume}
A single JSON object — no markdown, no code fences — shaped like this:
{
  "header": { "name": string, "title": string, "contact": string (one line, " · " separated) },
  "sections": [
    { "heading": string, "kind": "text", "text": string },
    { "heading": string, "kind": "bullets", "bullets": string[] },
    { "heading": string, "kind": "entries", "entries": [
        { "title": string, "subtitle": string, "meta": string, "bullets": string[] }
    ]}
  ],
  "changeLog": string[]
}

RESUME RULES — these override everything else:
- Keep the candidate's OWN section order and OWN headings, verbatim, in the original language. Do not rename "Work Experience" to "Professional Experience", do not merge or split sections, do not add sections the resume does not have, do not drop sections.
- Pick "kind" per section by what the original looks like: prose block → "text"; flat list (skills, languages) → "bullets"; jobs / education / projects with a title and dates → "entries" (title = role or degree, subtitle = company or institution, meta = dates and location, bullets = the achievement lines).
- Never change facts: names, employers, institutions, dates, job titles, contact details, and degrees stay exactly as written.
- NEVER invent experience, employers, tools, metrics, or numbers. If the user's instructions ask for something the resume cannot honestly support, skip it and say so in changeLog.
- What you MAY change: order of bullets and of skills (put what the posting asks for first), wording and phrasing, which achievements are emphasised, and the terminology used for technologies the candidate demonstrably already used (e.g. writing "React 18" or "CI/CD" where the resume implies it) so the ATS keywords match.
- Apply the user's instructions below literally. They outrank your own judgement about what the resume needs.
- Keep every bullet a single sentence, starting with a verb, and keep roughly the original length — do not inflate the resume.
- changeLog: one short line per change you made, plus one line for anything requested that you deliberately did not do and why.`;

const LETTER_QUALITY_RULES = `Every letter must:
- Open with a specific hook about this company or role — never "I am writing to express my interest".
- Carry the exact keywords from the job posting listed under MATCHED KEYWORDS, worded as the posting words them, so ATS keyword matching passes.
- Name the role title from the posting explicitly in the first two lines.
- Back the fit with 1–2 concrete facts that exist in the resume (a shipped result, a number, a stack) — never a vague claim.
- Address the biggest gap in one short honest clause only when it is a critical gap, framed as adjacent experience. Never apologise, never list weaknesses.
- End with a concrete, low-friction call to action.
- No buzzword stacking, no flattery, no em-dash-heavy AI phrasing, no invented facts.`;

interface BuildGeneratePromptArgs {
  resumeText: string;
  jobPosting: string;
  analysis: AnalysisResult;
  targets: GenerateTarget[];
  instructions: string;
  company: string;
  hrName: string;
  language: string;
}

export function buildGeneratePrompt({
  resumeText,
  jobPosting,
  analysis,
  targets,
  instructions,
  company,
  hrName,
  language,
}: BuildGeneratePromptArgs): string {
  const letterLanguage =
    language === 'auto' ? 'the dominant language of the JOB POSTING below' : language;

  const matched = analysis.keywords.matched.slice(0, 12).join(', ') || '—';
  const missing = [...analysis.keywords.missing, ...(analysis.atsScore?.missingKeywords ?? [])]
    .slice(0, 12)
    .join(', ');
  const topStrengths = analysis.strengths.slice(0, 3).join('; ') || '—';
  const topGaps =
    analysis.skillGaps
      .filter(g => g.priority === 'critical')
      .slice(0, 3)
      .map(g => g.skill)
      .join(', ') || '—';

  const blocks: string[] = [];

  if (targets.includes('resume')) blocks.push(RESUME_SPEC);

  if (targets.includes('coverLetter')) {
    blocks.push(`${SECTION_MARKER.coverLetter}
A cover letter, plain text only — no subject line, no date, no address block, no markdown.
3 paragraphs, 220–280 words: the hook and the role, then the proof of fit, then the call to action.`);
  }

  if (targets.includes('companyEmail')) {
    blocks.push(`${SECTION_MARKER.companyEmail}
An email to the company's hiring address${company ? ` (${company})` : ''}.
First line exactly "Subject: <line>" — the subject names the role and one differentiator, max 70 characters.
Then a blank line, then the body: 120–160 words, 3 short paragraphs, greeting and sign-off included. Assume the reader skims it on a phone.`);
  }

  if (targets.includes('hrMessage')) {
    blocks.push(`${SECTION_MARKER.hrMessage}
A direct message to the recruiter${hrName ? ` (${hrName})` : ''} on LinkedIn or Telegram, plain text.
90–130 words, no subject line, no markdown, conversational but professional. Address them by name if one is given.
It must still contain the role title and 2–3 of the matched keywords verbatim, because recruiters paste these into their tracking system.
End with one direct question that is easy to answer.`);
  }

  return `You are a senior career writer and ATS specialist. Produce ONLY the items requested below, using the exact output format.

OUTPUT LANGUAGE — non-negotiable, decide this before writing anything:
- The three letters (cover letter, company email, recruiter message): write them in ${letterLanguage}.
- The resume: keep the language it is already written in. Never translate a resume.
- The user's instructions below may be written in a completely different language. That is only the language they happen to speak to you in — it is NOT a request to switch languages, and it must not influence the output language above. A recruiter reading a letter in the wrong language discards it.

USER'S INSTRUCTIONS (highest priority for CONTENT — follow literally; they never override the output language):
${instructions.trim() || '(none — apply your own judgement within the rules below)'}

ANALYSIS CONTEXT (already computed — do not repeat or re-score it):
- Match score: ${analysis.matchScore}/100 (${analysis.confidence} confidence)
- Role / company: ${company || 'see the job posting'}
- Top strengths: ${topStrengths}
- Critical gaps: ${topGaps}
- MATCHED KEYWORDS (weave these in verbatim): ${matched}
- MISSING KEYWORDS (add ONLY where the resume honestly supports them): ${missing || '—'}

${LETTER_QUALITY_RULES}

OUTPUT FORMAT — emit these sections in this exact order, each opened by its marker on its own line, and nothing before the first marker or between a marker and its content. Close with ${END_MARKER} on its own line. Do not emit any section that is not listed here.

${blocks.join('\n\n')}

${END_MARKER}

<resume>
${resumeText}
</resume>

<job_posting>
${jobPosting}
</job_posting>`;
}
