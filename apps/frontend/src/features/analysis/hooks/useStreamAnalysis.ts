import { useCallback, useRef, useState } from 'react';
import { AnalysisResult, useStore } from '@/app/store';
import { SSEEvent, useSSE } from '@/shared/hooks/useSSE';
import { ANALYZE_URL } from '../api/analyze';

type PartialAnalysis = Partial<
  Pick<
    AnalysisResult,
    'matchScore' | 'confidence' | 'categoryScores' | 'strengths' | 'skillGaps' | 'recommendations'
  >
>;

const EMPTY_CATEGORY_SCORES: AnalysisResult['categoryScores'] = {
  technicalSkills: 0,
  experience: 0,
  cultureFit: 0,
  keywords: 0,
  seniority: 0,
  tools: 0,
};

export function useStreamAnalysis() {
  const setAnalysis = useStore(s => s.setAnalysis);
  const setStreamingStatus = useStore(s => s.setStreamingStatus);
  const addToHistory = useStore(s => s.addToHistory);

  const [partial, setPartial] = useState<PartialAnalysis>({});
  const [error, setError] = useState<string | null>(null);
  const accRef = useRef<Partial<AnalysisResult>>({});
  const companyRef = useRef('Unknown Company');

  const handleEvent = useCallback(
    (event: SSEEvent) => {
      const acc = accRef.current;

      switch (event.type) {
        case 'match_score': {
          const d = event.data as { score: number; confidence: AnalysisResult['confidence'] };
          acc.matchScore = d.score;
          acc.confidence = d.confidence;
          setPartial(p => ({ ...p, matchScore: d.score, confidence: d.confidence }));
          break;
        }
        case 'summary': {
          acc.summary = event.data as string;
          break;
        }
        case 'category_scores': {
          acc.categoryScores = event.data as AnalysisResult['categoryScores'];
          setPartial(p => ({ ...p, categoryScores: acc.categoryScores }));
          break;
        }
        case 'strengths': {
          acc.strengths = event.data as string[];
          setPartial(p => ({ ...p, strengths: acc.strengths }));
          break;
        }
        case 'gaps': {
          acc.skillGaps = event.data as AnalysisResult['skillGaps'];
          setPartial(p => ({ ...p, skillGaps: acc.skillGaps }));
          break;
        }
        case 'recommendations': {
          acc.recommendations = event.data as string[];
          setPartial(p => ({ ...p, recommendations: acc.recommendations }));
          break;
        }
        case 'keywords': {
          acc.keywords = event.data as AnalysisResult['keywords'];
          break;
        }
        case 'red_flags': {
          acc.redFlags = event.data as AnalysisResult['redFlags'];
          break;
        }
        case 'ats_score': {
          acc.atsScore = event.data as AnalysisResult['atsScore'];
          break;
        }
        case 'done': {
          const result: AnalysisResult = {
            matchScore: acc.matchScore ?? 0,
            confidence: acc.confidence ?? 'low',
            summary: acc.summary ?? '',
            categoryScores: acc.categoryScores ?? EMPTY_CATEGORY_SCORES,
            strengths: acc.strengths ?? [],
            skillGaps: acc.skillGaps ?? [],
            redFlags: acc.redFlags ?? [],
            recommendations: acc.recommendations ?? [],
            keywords: acc.keywords ?? { matched: [], missing: [] },
            atsScore: acc.atsScore ?? null,
          };
          setAnalysis(result);
          addToHistory({
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            company: companyRef.current,
            result,
          });
          setStreamingStatus('done');
          break;
        }
        case 'error': {
          const d = event.data as { message?: string } | null;
          setError(d?.message ?? 'Analysis failed. Please try again.');
          setStreamingStatus('error');
          break;
        }
      }
    },
    [setAnalysis, setStreamingStatus, addToHistory],
  );

  const { status, connect, abort } = useSSE(handleEvent);

  const start = useCallback(
    async (
      resumeText: string,
      jobPosting: string,
      company = 'Unknown Company',
      language = 'auto',
    ) => {
      accRef.current = {};
      companyRef.current = company;
      setPartial({});
      setError(null);
      setStreamingStatus('connecting');
      await connect(ANALYZE_URL, { resumeText, jobPosting, language });
    },
    [connect, setStreamingStatus],
  );

  return { status, partial, error, start, abort };
}
