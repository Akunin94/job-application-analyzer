export interface EnhancedResume {
  name: string;
  title: string;
  contact: string;
  summary: string;
  experience: Array<{
    company: string;
    role: string;
    period: string;
    location: string;
    bullets: string[];
  }>;
  skills: string[];
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  languages?: string[];
}

export function buildEnhanceResumePrompt(
  resumeText: string,
  jobPosting: string,
  improvements: string[],
): string {
  const improvementList = improvements.map((imp, i) => `${i + 1}. ${imp}`).join('\n');

  return `You are an expert resume writer. Rewrite the candidate's resume to incorporate the specific improvements listed below, targeting the provided job posting.

RULES:
- Keep ALL factual information (companies, dates, education, contact) exactly as-is
- Only incorporate the listed improvements — do not invent new experience or skills
- Make changes sound natural and authentic, not keyword-stuffed
- Preserve the candidate's voice and writing style
- If an improvement cannot be incorporated without fabricating information, skip it gracefully

Improvements to incorporate:
${improvementList}

Return ONLY a valid JSON object — no markdown, no code fences, no preamble.

The JSON must match this exact structure:
{
  "name": <full name from resume>,
  "title": <professional title/headline>,
  "contact": <contact line: email, linkedin, location — joined by " · ">,
  "summary": <2-4 sentence professional summary>,
  "experience": [
    {
      "company": <company name>,
      "role": <job title>,
      "period": <e.g. "Sep 2023 – Present">,
      "location": <city/country or "Remote">,
      "bullets": <array of 3-6 achievement-focused bullet points>
    }
  ],
  "skills": <flat array of skill strings, grouped naturally>,
  "education": [
    {
      "institution": <school name>,
      "degree": <degree and field>,
      "year": <graduation year or range>
    }
  ],
  "languages": <optional array of spoken languages if present in resume>
}

<resume>
${resumeText}
</resume>

<job_posting>
${jobPosting}
</job_posting>`;
}
