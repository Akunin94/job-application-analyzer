import { produce } from 'immer';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type StreamingStatus = 'idle' | 'connecting' | 'streaming' | 'done' | 'error';

export interface AnalysisResult {
  matchScore: number;
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
  skillGaps: Array<{
    skill: string;
    priority: 'critical' | 'important' | 'nice-to-have';
    context: string;
  }>;
  redFlags: Array<{
    flag: string;
    quote: string;
    severity: 'warning' | 'critical';
  }>;
  recommendations: string[];
  keywords: { matched: string[]; missing: string[] };
  atsScore: {
    score: number;
    verdict: 'likely_pass' | 'borderline' | 'likely_reject';
    missingKeywords: string[];
    formattingTips: string[];
  } | null;
}

export interface HistoryEntry {
  id: string;
  date: string;
  company: string;
  result: AnalysisResult;
}

export interface ResumeVersion {
  id: string;
  /** Defaults to the file name; the user can rename it to something meaningful. */
  name: string;
  fileName: string;
  text: string;
  addedAt: string;
}

/**
 * Versions are persisted, and a resume is tens of kilobytes of text — an
 * unbounded list would eventually blow the localStorage quota and take the
 * history slice down with it. The oldest inactive version is evicted instead.
 */
export const MAX_RESUME_VERSIONS = 10;

export interface WebhookConfig {
  notion: { integrationToken: string; databaseId: string };
  airtable: { apiKey: string; baseId: string; tableName: string };
}

interface AppStore {
  // resume slice (persisted)
  resumes: ResumeVersion[];
  activeResumeId: string | null;
  addResume: (text: string, fileName: string) => void;
  selectResume: (id: string) => void;
  renameResume: (id: string, name: string) => void;
  removeResume: (id: string) => void;
  clearResumes: () => void;

  // analysis slice
  currentAnalysis: AnalysisResult | null;
  streamingStatus: StreamingStatus;
  setAnalysis: (result: AnalysisResult) => void;
  setStreamingStatus: (status: StreamingStatus) => void;

  // history slice (persisted)
  history: HistoryEntry[];
  addToHistory: (entry: HistoryEntry) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;

  // webhook config slice (persisted)
  webhookConfig: WebhookConfig;
  setWebhookConfig: (config: Partial<WebhookConfig>) => void;
}

export const useStore = create<AppStore>()(
  devtools(
    persist(
      set => ({
        // resume slice
        resumes: [],
        activeResumeId: null,
        addResume: (text, fileName) =>
          set(
            produce((s: AppStore) => {
              // Re-uploading a file whose text is already stored selects that
              // version instead of stacking an identical copy next to it.
              const existing = s.resumes.find(r => r.text === text);
              if (existing) {
                s.activeResumeId = existing.id;
                return;
              }

              const version: ResumeVersion = {
                id: crypto.randomUUID(),
                name: fileName,
                fileName,
                text,
                addedAt: new Date().toISOString(),
              };
              s.resumes.unshift(version);
              s.activeResumeId = version.id;

              // The new version sits at index 0 and is the active one, so the
              // overflow is always the oldest and never the one in use.
              s.resumes = s.resumes.slice(0, MAX_RESUME_VERSIONS);
            }),
            false,
            'addResume',
          ),
        selectResume: id =>
          set(
            produce((s: AppStore) => {
              if (s.resumes.some(r => r.id === id)) s.activeResumeId = id;
            }),
            false,
            'selectResume',
          ),
        renameResume: (id, name) =>
          set(
            produce((s: AppStore) => {
              const version = s.resumes.find(r => r.id === id);
              // An all-whitespace label would render as a blank row with no way
              // to tell the versions apart, so it falls back to the file name.
              if (version) version.name = name.trim() || version.fileName;
            }),
            false,
            'renameResume',
          ),
        removeResume: id =>
          set(
            produce((s: AppStore) => {
              s.resumes = s.resumes.filter(r => r.id !== id);
              if (s.activeResumeId === id) {
                s.activeResumeId = s.resumes[0]?.id ?? null;
              }
            }),
            false,
            'removeResume',
          ),
        clearResumes: () =>
          set(
            produce((s: AppStore) => {
              s.resumes = [];
              s.activeResumeId = null;
            }),
            false,
            'clearResumes',
          ),

        // analysis slice
        currentAnalysis: null,
        streamingStatus: 'idle',
        setAnalysis: result =>
          set(
            produce((s: AppStore) => {
              s.currentAnalysis = result;
            }),
            false,
            'setAnalysis',
          ),
        setStreamingStatus: status =>
          set(
            produce((s: AppStore) => {
              s.streamingStatus = status;
            }),
            false,
            'setStreamingStatus',
          ),

        // history slice
        history: [],
        addToHistory: entry =>
          set(
            produce((s: AppStore) => {
              s.history.unshift(entry);
            }),
            false,
            'addToHistory',
          ),
        removeFromHistory: id =>
          set(
            produce((s: AppStore) => {
              s.history = s.history.filter(e => e.id !== id);
            }),
            false,
            'removeFromHistory',
          ),
        clearHistory: () =>
          set(
            produce((s: AppStore) => {
              s.history = [];
            }),
            false,
            'clearHistory',
          ),

        // webhook config
        webhookConfig: {
          notion: { integrationToken: '', databaseId: '' },
          airtable: { apiKey: '', baseId: '', tableName: '' },
        },
        setWebhookConfig: config =>
          set(
            produce((s: AppStore) => {
              Object.assign(s.webhookConfig, config);
            }),
            false,
            'setWebhookConfig',
          ),
      }),
      {
        name: 'ai-job-analyzer',
        partialize: state => ({
          history: state.history,
          webhookConfig: state.webhookConfig,
          resumes: state.resumes,
          activeResumeId: state.activeResumeId,
        }),
      },
    ),
    { name: 'AppStore' },
  ),
);
