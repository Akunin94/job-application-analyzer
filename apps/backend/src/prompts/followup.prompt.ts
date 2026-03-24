import { AnalysisResult } from '../schemas/analyze.schema.js';

export function buildFollowUpPrompt(
  resumeText: string,
  jobPosting: string,
  analysis: AnalysisResult,
  interviewerName: string,
  interviewDate: string,
  keyPoints: string,
  language = 'auto',
): string {
  const topStrengths = analysis.strengths.slice(0, 3).join(', ');
  const langInstruction =
    language === 'auto'
      ? 'Detect the dominant language of the job posting and write the email in that language.'
      : `Write the email in ${language}.`;

  return `Write a brief, professional post-interview follow-up email.

Language: ${langInstruction}

Context:
- Interviewer: ${interviewerName || 'the interviewer'}
- Interview date: ${interviewDate || 'recently'}
- Key discussion points from the interview: ${keyPoints || 'not specified'}
- Candidate top strengths: ${topStrengths}

Requirements:
- Subject line on the first line, prefixed with "Subject: "
- Blank line, then the email body
- 3–4 short paragraphs, ~150 words total
- Thank the interviewer by name for their time
- Reference 1–2 specific topics from the key discussion points (or from the job posting if none given)
- Briefly reinforce why this role is a strong fit using one top strength
- End with a clear, confident next-step statement
- Warm but professional tone — not sycophantic
- Return ONLY the email (subject + body) — no extra commentary

<resume>
${resumeText}
</resume>

<job_posting>
${jobPosting}
</job_posting>`;
}
