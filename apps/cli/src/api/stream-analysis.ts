export interface SkillGap {
  skill: string;
  priority: 'critical' | 'important' | 'nice-to-have';
  context: string;
}

export interface CategoryScores {
  technicalSkills: number;
  experience: number;
  cultureFit: number;
  keywords: number;
  seniority: number;
  tools: number;
}

export interface AnalysisResult {
  matchScore: number;
  confidence: 'low' | 'medium' | 'high';
  summary: string;
  categoryScores: CategoryScores;
  strengths: string[];
  skillGaps: SkillGap[];
  redFlags: string[];
  recommendations: string[];
  keywords: { matched: string[]; missing: string[] };
  resumeSuggestions?: Array<{
    section: string;
    type: 'add' | 'rewrite' | 'strengthen' | 'remove';
    suggestion: string;
    reason: string;
  }> | null;
}

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

export type SSEEvent =
  | { type: 'match_score'; data: { score: number; confidence: 'low' | 'medium' | 'high' } }
  | { type: 'category_scores'; data: CategoryScores }
  | { type: 'strengths'; data: string[] }
  | { type: 'gaps'; data: SkillGap[] }
  | { type: 'recommendations'; data: string[] }
  | { type: 'done'; data: AnalysisResult }
  | { type: 'error'; data: { message: string } };

export async function* streamAnalysis(
  apiUrl: string,
  resumeText: string,
  jobPosting: string,
  company: string,
  language: string,
): AsyncGenerator<SSEEvent> {
  const res = await fetch(`${apiUrl}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText, jobPosting, company, language }),
  });

  if (!res.ok || !res.body) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    let eventType = '';
    let dataLine = '';

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        dataLine = line.slice(6).trim();
      } else if (line === '' && eventType && dataLine) {
        try {
          const parsed = JSON.parse(dataLine) as unknown;
          yield { type: eventType, data: parsed } as SSEEvent;
        } catch {
          // ignore malformed
        }
        eventType = '';
        dataLine = '';
      }
    }
  }
}

export async function uploadResume(apiUrl: string, pdfPath: string): Promise<string> {
  const { default: FormData } = await import('form-data');
  const { createReadStream } = await import('fs');
  const fetch = (await import('node-fetch')).default;

  const form = new FormData();
  form.append('resume', createReadStream(pdfPath));

  const res = await fetch(`${apiUrl}/api/upload/resume`, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Upload failed: HTTP ${res.status}`);
  }

  const data = (await res.json()) as { text: string };
  return data.text;
}

export async function enhanceResume(
  apiUrl: string,
  resumeText: string,
  jobPosting: string,
  improvements: string[],
): Promise<EnhancedResume> {
  const res = await fetch(`${apiUrl}/api/analyze/enhance-resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText, jobPosting, improvements }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<EnhancedResume>;
}
