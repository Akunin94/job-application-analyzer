export interface AnalysisResult {
  matchScore: number; // 0–100
  confidence: 'low' | 'medium' | 'high';
  summary: string;
  categoryScores: {
    technicalSkills: number;
    experience: number;
    cultureFit: number;
    keywords: number;
    seniority: number;
    tools: number;
  };
  strengths: string[];
  skillGaps: SkillGap[];
  redFlags: string[];
  recommendations: string[];
  keywords: { matched: string[]; missing: string[] };
  coverLetterOutline: string;
}

export interface SkillGap {
  skill: string;
  priority: 'critical' | 'important' | 'nice-to-have';
  context: string;
}

export type SSEEvent =
  | { type: 'match_score'; data: { score: number; confidence: 'low' | 'medium' | 'high' } }
  | { type: 'category_scores'; data: AnalysisResult['categoryScores'] }
  | { type: 'strengths'; data: string[] }
  | { type: 'gaps'; data: SkillGap[] }
  | { type: 'recommendations'; data: string[] }
  | { type: 'cover_letter'; data: string }
  | { type: 'done'; data: null }
  | { type: 'error'; data: { message: string } };
