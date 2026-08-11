export function buildAnalyzePrompt(
  resumeText: string,
  jobPosting: string,
  language = 'auto',
): string {
  const langInstruction =
    language === 'auto'
      ? 'Detect the dominant language of the job posting and write ALL text fields in that language.'
      : `Write ALL text fields in ${language}.`;

  return `You are an expert technical recruiter. Score the resume against the job posting and report exactly what is missing. Nothing else.

Language: ${langInstruction}

Scope — keep the output tight:
- Do NOT research the company, estimate salary, write interview questions, or build a learning roadmap.
- Judge ONLY what is in the two documents below. Never invent experience the resume does not contain.
- Every text field is one or two sentences. No preamble, no filler.

Return ONLY a valid JSON object — no markdown, no code fences, no preamble:
{
  "matchScore": <number 0-100>,
  "confidence": <"low" | "medium" | "high">,
  "summary": <string, 2 sentences: the verdict and the single biggest blocker>,
  "categoryScores": {
    "technicalSkills": <0-100>,
    "experience": <0-100>,
    "cultureFit": <0-100>,
    "keywords": <0-100>,
    "seniority": <0-100>,
    "tools": <0-100>
  },
  "strengths": <string[], max 5 — what already matches, each one line>,
  "skillGaps": [{ "skill": string, "priority": "critical"|"important"|"nice-to-have", "context": string }],
  "recommendations": <string[], max 5 — concrete edits that would raise the score>,
  "keywords": { "matched": string[], "missing": string[] },
  "redFlags": [{ "flag": string, "quote": string, "severity": "warning"|"critical" }],
  "atsScore": <null if the posting is too vague to extract keywords, otherwise:
    { "score": number 0-100,
      "verdict": "likely_pass"|"borderline"|"likely_reject",
      "missingKeywords": string[] (max 10),
      "formattingTips": string[] (max 3) }>
}

Scoring: weigh technical skills and required experience heaviest; keywords and tools next; seniority and culture fit last. matchScore is a weighted judgement, not the average of categoryScores.

skillGaps — this is the main deliverable. One entry per requirement in the posting that the resume does not evidence.
- "critical" = named as a hard requirement and absent from the resume
- "important" = clearly expected for the role, weakly covered
- "nice-to-have" = listed as a plus
- "context": quote or paraphrase the requirement from the posting, and say what the resume shows instead.
- Order: critical first. Max 12 entries.

redFlags — only things that could disqualify the candidate outright, each with a short verbatim "quote" from the posting proving it: geographic/remote restriction, on-site requirement, security clearance, a hard language or framework requirement not met, a required stack not on the resume, or an experience gap of 3+ years versus the requirement. Empty array if none.

atsScore.missingKeywords: exact terms from the posting that an ATS would look for and cannot find in the resume.

<resume>
${resumeText}
</resume>

<job_posting>
${jobPosting}
</job_posting>`;
}
