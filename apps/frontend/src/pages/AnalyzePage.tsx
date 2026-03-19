import { CheckCircle2 } from 'lucide-react';
import { useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { AnalysisResult, useStore } from '@/app/store';
import { AnalysisForm } from '@/features/analysis/components/AnalysisForm';
import { ANALYZE_URL } from '@/features/analysis/api/analyze';
import { AnalysisFormValues } from '@/features/analysis/schemas/analysis.schema';
import { useResumeStore } from '@/features/resume/hooks/useResumeStore';
import { Card } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import { useSSE } from '@/shared/hooks/useSSE';

export default function AnalyzePage() {
  const setAnalysis = useStore(s => s.setAnalysis);
  const setStreamingStatus = useStore(s => s.setStreamingStatus);
  const streamingStatus = useStore(s => s.streamingStatus);
  const { resumeText } = useResumeStore();

  const partialRef = useRef<Partial<AnalysisResult>>({});

  const handleEvent = useCallback(
    (event: { type: string; data: unknown }) => {
      const partial = partialRef.current;

      switch (event.type) {
        case 'match_score': {
          const d = event.data as { score: number; confidence: AnalysisResult['confidence'] };
          partial.matchScore = d.score;
          partial.confidence = d.confidence;
          break;
        }
        case 'category_scores':
          partial.categoryScores = event.data as AnalysisResult['categoryScores'];
          break;
        case 'strengths':
          partial.strengths = event.data as string[];
          break;
        case 'gaps':
          partial.skillGaps = event.data as AnalysisResult['skillGaps'];
          break;
        case 'recommendations':
          partial.recommendations = event.data as string[];
          break;
        case 'done': {
          const result: AnalysisResult = {
            matchScore: partial.matchScore ?? 0,
            confidence: partial.confidence ?? 'low',
            summary: partial.summary ?? '',
            categoryScores: partial.categoryScores ?? {
              technicalSkills: 0,
              experience: 0,
              cultureFit: 0,
              keywords: 0,
              seniority: 0,
              tools: 0,
            },
            strengths: partial.strengths ?? [],
            skillGaps: partial.skillGaps ?? [],
            redFlags: partial.redFlags ?? [],
            recommendations: partial.recommendations ?? [],
            keywords: partial.keywords ?? { matched: [], missing: [] },
            coverLetterOutline: partial.coverLetterOutline ?? '',
          };
          setAnalysis(result);
          setStreamingStatus('done');
          toast.success('Analysis complete!');
          break;
        }
        case 'error': {
          const d = event.data as { message: string };
          setStreamingStatus('error');
          toast.error(d.message ?? 'Analysis failed');
          break;
        }
      }
    },
    [setAnalysis, setStreamingStatus],
  );

  const { connect, status } = useSSE(handleEvent);
  const isLoading = status === 'connecting' || status === 'streaming';

  const handleSubmit = useCallback(
    async (values: AnalysisFormValues) => {
      partialRef.current = {};
      setStreamingStatus('connecting');
      await connect(ANALYZE_URL, { resumeText, jobPosting: values.jobPosting });
    },
    [connect, resumeText, setStreamingStatus],
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Analyze Job Match</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your resume and paste a job posting to get an AI-powered match analysis.
        </p>
      </div>

      <Card className="p-6">
        <AnalysisForm onSubmit={handleSubmit} isLoading={isLoading} />
      </Card>

      {streamingStatus === 'done' && (
        <>
          <Separator className="my-6" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 size={16} className="text-green-500" />
            Analysis complete — results dashboard coming in Phase 8.
          </div>
        </>
      )}
    </div>
  );
}
