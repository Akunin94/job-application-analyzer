export function buildAnalyzePrompt(resumeText: string, jobPosting: string): string {
  return `You are an expert technical recruiter and career coach. Analyze the resume against the job posting below.

IMPORTANT: Return ONLY a valid JSON object — no markdown, no code fences, no preamble.

The JSON must match this exact structure:
{
  "matchScore": <number 0-100>,
  "confidence": <"low" | "medium" | "high">,
  "summary": <string, 2-3 sentences>,
  "categoryScores": {
    "technicalSkills": <number 0-100>,
    "experience": <number 0-100>,
    "cultureFit": <number 0-100>,
    "keywords": <number 0-100>,
    "seniority": <number 0-100>,
    "tools": <number 0-100>
  },
  "strengths": <string[]>,
  "skillGaps": [{ "skill": string, "priority": "critical"|"important"|"nice-to-have", "context": string }],
  "redFlags": <string[]>,
  "recommendations": <string[]>,
  "keywords": { "matched": string[], "missing": string[] },
  "coverLetterOutline": <string, brief outline for a cover letter>
}

Evaluate:
- Technical skills match (languages, frameworks, tools)
- Experience level and years relative to requirements
- Culture fit signals (remote work, team size, agile/etc.)
- Keyword overlap with job description
- Seniority level match
- Tools and stack alignment

Detect red flags where applicable:
- US-only remote restrictions
- Mobile development required but missing from resume
- Hard language/framework requirement not met
- Strict on-site requirement
- Security clearance required

<resume>
${resumeText}
</resume>

<job_posting>
${jobPosting}
</job_posting>`;
}
