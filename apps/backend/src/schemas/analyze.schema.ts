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

const salaryEstimateSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
  currency: z.string(),
  period: z.enum(['year', 'month']),
  confidence: z.enum(['low', 'medium', 'high']),
  notes: z.string(),
});

const atsScoreSchema = z.object({
  score: z.number().min(0).max(100),
  verdict: z.enum(['likely_pass', 'borderline', 'likely_reject']),
  missingKeywords: z.array(z.string()),
  formattingTips: z.array(z.string()),
});

const resumeSuggestionSchema = z.object({
  section: z.string(),
  type: z.enum(['rewrite', 'add', 'remove', 'strengthen']),
  current: z.string(),
  suggestion: z.string(),
  reason: z.string(),
});

const interviewQuestionSchema = z.object({
  question: z.string(),
  category: z.enum(['technical', 'behavioral', 'situational', 'culture-fit']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tip: z.string(),
});

const roadmapResourceSchema = z.object({
  title: z.string(),
  type: z.enum(['course', 'docs', 'book', 'tutorial', 'practice']),
});

const companyResearchSchema = z.object({
  name: z.string(),
  overview: z.string(),
  industry: z.string(),
  size: z.string(),
  funding: z.string(),
  techStack: z.array(z.string()),
  culture: z.array(z.string()),
  interviewProcess: z.string(),
  confidence: z.enum(['low', 'medium', 'high']),
  disclaimer: z.string(),
});

const skillsRoadmapItemSchema = z.object({
  skill: z.string(),
  priority: z.enum(['critical', 'important', 'nice-to-have']),
  timeEstimate: z.string(),
  resources: z.array(roadmapResourceSchema),
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
  coverLetterOutline: z.string(),
  salaryEstimate: salaryEstimateSchema.nullable(),
  atsScore: atsScoreSchema.nullable(),
  skillsRoadmap: z.array(skillsRoadmapItemSchema).nullable(),
  interviewPrep: z.array(interviewQuestionSchema).nullable(),
  resumeSuggestions: z.array(resumeSuggestionSchema).nullable(),
  companyResearch: companyResearchSchema.nullable(),
});

export const analyzeRequestSchema = z.object({
  resumeText: z.string().min(1, 'Resume text is required'),
  jobPosting: z.string().min(1, 'Job posting is required'),
  language: z.string().default('auto'),
});

export const coverLetterRequestSchema = z.object({
  resumeText: z.string().min(1, 'Resume text is required'),
  jobPosting: z.string().min(1, 'Job posting is required'),
  analysis: analysisResultSchema,
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
export type CoverLetterRequest = z.infer<typeof coverLetterRequestSchema>;
export type FollowUpRequest = z.infer<typeof followUpRequestSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
