export type GenerateTarget = 'resume' | 'coverLetter' | 'companyEmail' | 'hrMessage';

export interface ResumeEntry {
  title: string;
  subtitle: string;
  meta: string;
  bullets: string[];
}

export type ResumeSection =
  | { heading: string; kind: 'text'; text: string }
  | { heading: string; kind: 'bullets'; bullets: string[] }
  | { heading: string; kind: 'entries'; entries: ResumeEntry[] };

export interface GeneratedResume {
  header: { name: string; title: string; contact: string };
  sections: ResumeSection[];
  changeLog: string[];
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export interface GenerateResults {
  resume?: GeneratedResume;
  coverLetter?: string;
  companyEmail?: GeneratedEmail;
  hrMessage?: string;
}

export const TARGET_LABELS: Record<GenerateTarget, string> = {
  resume: 'Updated resume',
  coverLetter: 'Cover letter',
  companyEmail: 'Email to the company',
  hrMessage: 'Direct message to the recruiter',
};
