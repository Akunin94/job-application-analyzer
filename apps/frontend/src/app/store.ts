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
  coverLetterOutline: string;
  salaryEstimate: {
    min: number;
    max: number;
    currency: string;
    period: 'year' | 'month';
    confidence: 'low' | 'medium' | 'high';
    notes: string;
  } | null;
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

interface AppStore {
  // resume slice
  resumeText: string;
  resumeFileName: string;
  setResume: (text: string, fileName: string) => void;
  clearResume: () => void;

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
}

export const useStore = create<AppStore>()(
  devtools(
    persist(
      set => ({
        // resume slice
        resumeText: '',
        resumeFileName: '',
        setResume: (text, fileName) =>
          set(
            produce((s: AppStore) => {
              s.resumeText = text;
              s.resumeFileName = fileName;
            }),
            false,
            'setResume',
          ),
        clearResume: () =>
          set(
            produce((s: AppStore) => {
              s.resumeText = '';
              s.resumeFileName = '';
            }),
            false,
            'clearResume',
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
      }),
      {
        name: 'ai-job-analyzer',
        partialize: state => ({ history: state.history }),
      },
    ),
    { name: 'AppStore' },
  ),
);
