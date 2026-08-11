import { z } from 'zod';

const skillGapSchema = z.object({
  skill: z.string(),
  priority: z.enum(['critical', 'important', 'nice-to-have']),
  context: z.string(),
});

const redFlagSchema = z.object({
  flag: z.string(),
  quote: z.string(),
  severity: z.enum(['warning', 'critical']),
});

const atsScoreSchema = z.object({
  score: z.number().min(0).max(100),
  verdict: z.enum(['likely_pass', 'borderline', 'likely_reject']),
  missingKeywords: z.array(z.string()),
  formattingTips: z.array(z.string()),
});

export const analysisResultSchema = z.object({
  matchScore: z.number().min(0).max(100),
  confidence: z.enum(['low', 'medium', 'high']),
  summary: z.string(),
  categoryScores: z.object({
    technicalSkills: z.number().min(0).max(100),
    experience: z.number().min(0).max(100),
    cultureFit: z.number().min(0).max(100),
    keywords: z.number().min(0).max(100),
    seniority: z.number().min(0).max(100),
    tools: z.number().min(0).max(100),
  }),
  strengths: z.array(z.string()),
  skillGaps: z.array(skillGapSchema),
  redFlags: z.array(redFlagSchema),
  recommendations: z.array(z.string()),
  keywords: z.object({
    matched: z.array(z.string()),
    missing: z.array(z.string()),
  }),
  atsScore: atsScoreSchema.nullable(),
});

/**
 * The rewritten resume keeps the original document's own section order and
 * headings — the shape is deliberately loose so Claude can mirror whatever the
 * candidate already had instead of being forced into a fixed template.
 */
const resumeSectionSchema = z.discriminatedUnion('kind', [
  z.object({ heading: z.string(), kind: z.literal('text'), text: z.string() }),
  z.object({ heading: z.string(), kind: z.literal('bullets'), bullets: z.array(z.string()) }),
  z.object({
    heading: z.string(),
    kind: z.literal('entries'),
    entries: z.array(
      z.object({
        title: z.string(),
        subtitle: z.string().default(''),
        meta: z.string().default(''),
        bullets: z.array(z.string()).default([]),
      }),
    ),
  }),
]);

export const generatedResumeSchema = z.object({
  header: z.object({
    name: z.string(),
    title: z.string().default(''),
    contact: z.string().default(''),
  }),
  sections: z.array(resumeSectionSchema),
  changeLog: z.array(z.string()).default([]),
});

export const GENERATE_TARGETS = ['resume', 'coverLetter', 'companyEmail', 'hrMessage'] as const;

export const analyzeRequestSchema = z.object({
  resumeText: z.string().min(1, 'Resume text is required'),
  jobPosting: z.string().min(1, 'Job posting is required'),
  language: z.string().default('auto'),
});

/**
 * A batch is one HTTP request but N Claude calls, so the AI rate limiter — which
 * counts requests — can't see its real cost. The cap is what keeps a single
 * batch from spending a whole window's worth of budget.
 */
export const BATCH_MAX_JOBS = 10;

const batchJobSchema = z.object({
  id: z.string().min(1),
  company: z.string().default(''),
  jobPosting: z.string().min(1, 'Job posting is required'),
});

export const batchAnalyzeRequestSchema = z.object({
  resumeText: z.string().min(1, 'Resume text is required'),
  jobs: z
    .array(batchJobSchema)
    .min(1, 'Add at least one job posting')
    .max(BATCH_MAX_JOBS, `A batch holds at most ${BATCH_MAX_JOBS} job postings`),
  language: z.string().default('auto'),
});

export const generateRequestSchema = z.object({
  resumeText: z.string().min(1, 'Resume text is required'),
  jobPosting: z.string().min(1, 'Job posting is required'),
  analysis: analysisResultSchema,
  targets: z.array(z.enum(GENERATE_TARGETS)).min(1, 'Select at least one item to generate'),
  instructions: z.string().default(''),
  company: z.string().default(''),
  hrName: z.string().default(''),
  language: z.string().default('auto'),
});

export const followUpRequestSchema = z.object({
  resumeText: z.string().min(1, 'Resume text is required'),
  jobPosting: z.string().min(1, 'Job posting is required'),
  analysis: analysisResultSchema,
  interviewerName: z.string().default(''),
  interviewDate: z.string().default(''),
  keyPoints: z.string().default(''),
  language: z.string().default('auto'),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type BatchAnalyzeRequest = z.infer<typeof batchAnalyzeRequestSchema>;
export type BatchJob = z.infer<typeof batchJobSchema>;
export type GenerateRequest = z.infer<typeof generateRequestSchema>;
export type GenerateTarget = (typeof GENERATE_TARGETS)[number];
export type FollowUpRequest = z.infer<typeof followUpRequestSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type GeneratedResume = z.infer<typeof generatedResumeSchema>;
