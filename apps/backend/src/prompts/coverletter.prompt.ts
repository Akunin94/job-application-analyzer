import { AnalysisResult } from '../schemas/analyze.schema.js';

export function buildCoverLetterPrompt(
  resumeText: string,
  jobPosting: string,
  analysis: AnalysisResult,
  language = 'auto',
): string {
  const topStrengths = analysis.strengths.slice(0, 3).join(', ');
  const matchedKeywords = analysis.keywords.matched.slice(0, 8).join(', ');
  const langInstruction =
    language === 'auto'
      ? 'Detect the dominant language of the job posting and write the cover letter in that language.'
      : `Write the cover letter in ${language}.`;

  return `Write a tailored cover letter based on the resume and job posting below.

Language: ${langInstruction}

Requirements:
- 3 paragraphs, approximately 250 words total
- Opening: a specific hook about the company's mission or product — not generic
- Middle: highlight these top strengths: ${topStrengths}
- Weave in these matched keywords naturally: ${matchedKeywords}
- Closing: clear, confident call to action
- No generic phrases like "I am writing to express my interest" or "I believe I would be a great fit"
- Return ONLY the letter text — no subject line, no date, no address blocks

<resume>
${resumeText}
</resume>

<job_posting>
${jobPosting}
</job_posting>`;
}
