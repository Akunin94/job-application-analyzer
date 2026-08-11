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
  redFlags: RedFlag[];
  recommendations: string[];
  keywords: { matched: string[]; missing: string[] };
  atsScore: AtsScore | null;
}

export interface SkillGap {
  skill: string;
  priority: 'critical' | 'important' | 'nice-to-have';
  context: string;
}

export interface RedFlag {
  flag: string;
  quote: string;
  severity: 'warning' | 'critical';
}

export interface AtsScore {
  score: number;
  verdict: 'likely_pass' | 'borderline' | 'likely_reject';
  missingKeywords: string[];
  formattingTips: string[];
}

export type SSEEvent =
  | { type: 'match_score'; data: { score: number; confidence: 'low' | 'medium' | 'high' } }
  | { type: 'summary'; data: string }
  | { type: 'category_scores'; data: AnalysisResult['categoryScores'] }
  | { type: 'strengths'; data: string[] }
  | { type: 'gaps'; data: SkillGap[] }
  | { type: 'recommendations'; data: string[] }
  | { type: 'keywords'; data: AnalysisResult['keywords'] }
  | { type: 'red_flags'; data: RedFlag[] }
  | { type: 'ats_score'; data: AtsScore | null }
  | { type: 'done'; data: null }
  | { type: 'error'; data: { message: string } };

/** What the user can ask the generator for after reviewing the analysis. */
export type GenerateTarget = 'resume' | 'coverLetter' | 'companyEmail' | 'hrMessage';

/**
 * The rewritten resume mirrors the original document's own section order and
 * headings rather than a fixed template.
 */
export type ResumeSection =
  | { heading: string; kind: 'text'; text: string }
  | { heading: string; kind: 'bullets'; bullets: string[] }
  | { heading: string; kind: 'entries'; entries: ResumeEntry[] };

export interface ResumeEntry {
  title: string;
  subtitle: string;
  meta: string;
  bullets: string[];
}

export interface GeneratedResume {
  header: { name: string; title: string; contact: string };
  sections: ResumeSection[];
  changeLog: string[];
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export type GenerateSSEEvent =
  | { type: 'section_start'; data: { target: GenerateTarget } }
  | { type: 'delta'; data: { target: GenerateTarget; text: string } }
  | { type: 'section'; data: { target: GenerateTarget; data: unknown } }
  | { type: 'section_error'; data: { target: GenerateTarget; message: string } }
  | { type: 'done'; data: null }
  | { type: 'error'; data: { message: string } };
