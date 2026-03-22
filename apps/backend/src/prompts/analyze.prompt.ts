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
  "redFlags": [{ "flag": string, "quote": string, "severity": "warning"|"critical" }],
  "recommendations": <string[]>,
  "keywords": { "matched": string[], "missing": string[] },
  "coverLetterOutline": <string, brief outline for a cover letter>,
  "salaryEstimate": <null if truly impossible to estimate, otherwise:
    { "min": number, "max": number, "currency": string (ISO 4217),
      "period": "year"|"month", "confidence": "low"|"medium"|"high",
      "notes": string (1 sentence: data source or caveat) }>,
  "atsScore": <null if insufficient data, otherwise:
    { "score": number 0-100,
      "verdict": "likely_pass"|"borderline"|"likely_reject",
      "missingKeywords": string[],
      "formattingTips": string[] }>,
  "skillsRoadmap": <null if no skill gaps, otherwise array of:
    { "skill": string,
      "priority": "critical"|"important"|"nice-to-have",
      "timeEstimate": string (e.g. "2–4 weeks"),
      "resources": [{ "title": string, "type": "course"|"docs"|"book"|"tutorial"|"practice" }] }>,
  "interviewPrep": <array of 6-10 questions tailored to this role and resume:
    { "question": string,
      "category": "technical"|"behavioral"|"situational"|"culture-fit",
      "difficulty": "easy"|"medium"|"hard",
      "tip": string (1-2 sentence answering hint, e.g. STAR method cue or what the interviewer is really assessing) }>,
  "resumeSuggestions": <4-8 specific, actionable edits to better match this job posting:
    { "section": string (e.g. "Summary", "Work Experience", "Skills"),
      "type": "rewrite"|"add"|"remove"|"strengthen",
      "current": string (verbatim snippet from resume being changed, or "" if adding new content),
      "suggestion": string (the improved text — ready to paste in),
      "reason": string (1 sentence: why this change improves the match) }>,
  "companyResearch": <null if company cannot be identified from the posting, otherwise:
    { "name": string,
      "overview": string (2-3 sentences from your training knowledge),
      "industry": string,
      "size": string (e.g. "~200 employees", "10,000+", "Unknown"),
      "funding": string (e.g. "Series B", "Public (NASDAQ: XYZ)", "Bootstrapped", "Unknown"),
      "techStack": string[] (publicly known stack),
      "culture": string[] (3-5 culture bullet points from public sources),
      "interviewProcess": string (what the interview process typically looks like at this company),
      "confidence": "low"|"medium"|"high" (how well your training data covers this company),
      "disclaimer": string (1 sentence: note that info is from training data and may be outdated) }>
}

Evaluate:
- Technical skills match (languages, frameworks, tools)
- Experience level and years relative to requirements
- Culture fit signals (remote work, team size, agile/etc.)
- Keyword overlap with job description
- Seniority level match
- Tools and stack alignment

Detect red flags where applicable (severity "critical" = likely disqualifying, "warning" = worth noting):
- US-only remote restrictions (critical)
- Mobile development required but missing from resume (critical)
- Hard language/framework requirement not met (critical)
- Strict on-site requirement (warning or critical depending on context)
- Security clearance required (critical)
- Significant experience gap, e.g. 8+ years required vs 2 on resume (warning)
For each red flag, include a short verbatim "quote" from the job posting that proves it.

Estimate salary range:
- Use any explicit salary info from the posting first (confidence: "high")
- Otherwise infer from role title, seniority, tech stack, and location signals (confidence: "low" or "medium")
- Use annual USD by default; use local currency + "month" if the posting uses monthly figures
- Return null only if the role is too ambiguous to estimate at all

Estimate ATS score (Applicant Tracking System likelihood of passing automated filters):
- score: 0-100 based on keyword density match between resume and job posting
- verdict: "likely_pass" (≥70), "borderline" (40-69), "likely_reject" (<40)
- missingKeywords: important JD keywords/phrases absent from resume (max 10)
- formattingTips: ATS-friendly formatting suggestions relevant to this resume (e.g. avoid tables, add missing section headers, spell out acronyms); max 4 tips
- Return null only if the job posting is too vague to extract keywords

Build a skills roadmap for each skill gap:
- One entry per skillGap item, same priority
- timeEstimate: realistic calendar estimate to reach job-ready proficiency (e.g. "1–2 weeks", "1–3 months")
- resources: 2–4 real, well-known resources (e.g. official docs, Udemy, Coursera, freeCodeCamp, book titles); DO NOT invent URLs — titles only
- Order: critical gaps first, then important, then nice-to-have
- Return null only if skillGaps is empty

Generate interview prep questions:
- 6–10 questions total, mix of: technical (role-specific), behavioral (STAR-format), situational (hypothetical scenarios), culture-fit
- Weight toward categories most relevant to the role (e.g. more technical for senior engineering roles)
- difficulty: "easy" for warm-up/basics, "medium" for standard, "hard" for stretch/senior-level
- tip: what the interviewer is really assessing, and a brief hint (STAR cue, concept to mention, etc.)
- Questions must be specific to this role and resume — not generic

Generate resume suggestions:
- 4–8 specific edits to make the resume better match this job posting
- type: "rewrite" = replace existing text, "add" = new bullet/section, "remove" = cut irrelevant content, "strengthen" = improve weak phrasing
- current: exact snippet from resume (keep short, ≤2 sentences), or "" if adding
- suggestion: the improved text, ready to paste directly into the resume
- reason: one sentence on why this improves match score or ATS performance
- Focus on high-impact changes: summary, relevant bullet points, skills section, missing keywords

Research the company from the job posting:
- Extract the company name from the posting
- Use your training knowledge to fill in overview, industry, size, funding, techStack, culture, interviewProcess
- confidence: "high" = well-known company with extensive public info, "medium" = known but limited data, "low" = little public info
- disclaimer: always note info comes from training data and may not reflect current state
- Return null only if the company name cannot be identified at all

<resume>
${resumeText}
</resume>

<job_posting>
${jobPosting}
</job_posting>`;
}
