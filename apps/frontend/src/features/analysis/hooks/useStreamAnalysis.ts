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

export function useStreamAnalysis() {
  const setAnalysis = useStore(s => s.setAnalysis);
  const setStreamingStatus = useStore(s => s.setStreamingStatus);
  const addToHistory = useStore(s => s.addToHistory);

  const [partial, setPartial] = useState<PartialAnalysis>({});
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
        case 'red_flags': {
          acc.redFlags = event.data as AnalysisResult['redFlags'];
          break;
        }
        case 'salary': {
          acc.salaryEstimate = event.data as AnalysisResult['salaryEstimate'];
          break;
        }
        case 'ats_score': {
          acc.atsScore = event.data as AnalysisResult['atsScore'];
          break;
        }
        case 'skills_roadmap': {
          acc.skillsRoadmap = event.data as AnalysisResult['skillsRoadmap'];
          break;
        }
        case 'interview_prep': {
          acc.interviewPrep = event.data as AnalysisResult['interviewPrep'];
          break;
        }
        case 'resume_suggestions': {
          acc.resumeSuggestions = event.data as AnalysisResult['resumeSuggestions'];
          break;
        }
        case 'done': {
          const result: AnalysisResult = {
            matchScore: acc.matchScore ?? 0,
            confidence: acc.confidence ?? 'low',
            summary: '',
            categoryScores: acc.categoryScores ?? {
              technicalSkills: 0,
              experience: 0,
              cultureFit: 0,
              keywords: 0,
              seniority: 0,
              tools: 0,
            },
            strengths: acc.strengths ?? [],
            skillGaps: acc.skillGaps ?? [],
            redFlags: acc.redFlags ?? [],
            recommendations: acc.recommendations ?? [],
            keywords: { matched: [], missing: [] },
            coverLetterOutline: '',
            salaryEstimate: acc.salaryEstimate ?? null,
            atsScore: acc.atsScore ?? null,
            skillsRoadmap: acc.skillsRoadmap ?? null,
            interviewPrep: acc.interviewPrep ?? null,
            resumeSuggestions: acc.resumeSuggestions ?? null,
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
          setStreamingStatus('error');
          break;
        }
      }
    },
    [setAnalysis, setStreamingStatus, addToHistory],
  );

  const { status, connect, abort } = useSSE(handleEvent);

  const start = useCallback(
    async (resumeText: string, jobPosting: string, company = 'Unknown Company') => {
      accRef.current = {};
      companyRef.current = company;
      setPartial({});
      setStreamingStatus('connecting');
      await connect(ANALYZE_URL, { resumeText, jobPosting });
    },
    [connect, setStreamingStatus],
  );

  return { status, partial, start, abort };
}
