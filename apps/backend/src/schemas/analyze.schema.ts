import { z } from 'zod';

const skillGapSchema = z.object({
  skill: z.string(),
  priority: z.enum(['critical', 'important', 'nice-to-have']),
  context: z.string(),
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
  redFlags: z.array(z.string()),
  recommendations: z.array(z.string()),
  keywords: z.object({
    matched: z.array(z.string()),
    missing: z.array(z.string()),
  }),
  coverLetterOutline: z.string(),
});

export const analyzeRequestSchema = z.object({
  resumeText: z.string().min(1, 'Resume text is required'),
  jobPosting: z.string().min(1, 'Job posting is required'),
});

export const coverLetterRequestSchema = z.object({
  resumeText: z.string().min(1, 'Resume text is required'),
  jobPosting: z.string().min(1, 'Job posting is required'),
  analysis: analysisResultSchema,
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type CoverLetterRequest = z.infer<typeof coverLetterRequestSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
