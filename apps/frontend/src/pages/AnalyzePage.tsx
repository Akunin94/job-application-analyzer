import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/app/store';
import { AnalysisForm } from '@/features/analysis/components/AnalysisForm';
import {
  AnalysisResultDashboard,
  AnalysisResultSkeleton,
} from '@/features/analysis/components/AnalysisResult';
import { CoverLetterPanel } from '@/features/analysis/components/CoverLetterPanel';
import { FollowUpEmailPanel } from '@/features/analysis/components/FollowUpEmailPanel';
import { StreamingOutput } from '@/features/analysis/components/StreamingOutput';
import { useStreamAnalysis } from '@/features/analysis/hooks/useStreamAnalysis';
import { AnalysisFormValues } from '@/features/analysis/schemas/analysis.schema';
import { useResumeStore } from '@/features/resume/hooks/useResumeStore';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';

export default function AnalyzePage() {
  const { resumeText } = useResumeStore();
  const currentAnalysis = useStore(s => s.currentAnalysis);
  const { status, start } = useStreamAnalysis();
  const [showForm, setShowForm] = useState(!currentAnalysis);
  const [jobPosting, setJobPosting] = useState('');

  const isLoading = status === 'connecting' || status === 'streaming';

  const handleSubmit = async (values: AnalysisFormValues) => {
    setJobPosting(values.jobPosting);
    setShowForm(false);
    await start(resumeText, values.jobPosting, values.company ?? 'Unknown Company');
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6">
          <StreamingOutput
            text="Analyzing your application…"
            isStreaming
            className="text-muted-foreground"
          />
        </div>
        <AnalysisResultSkeleton />
      </div>
    );
  }

  if (!showForm && currentAnalysis) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Analysis Results</h1>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => setShowForm(true)}
          >
            <ArrowLeft size={14} />
            New Analysis
          </Button>
        </div>
        <AnalysisResultDashboard result={currentAnalysis} />
        {jobPosting && (
          <>
            <Separator className="my-6" />
            <div className="space-y-4">
              <CoverLetterPanel
                resumeText={resumeText}
                jobPosting={jobPosting}
                analysis={currentAnalysis}
              />
              <FollowUpEmailPanel
                resumeText={resumeText}
                jobPosting={jobPosting}
                analysis={currentAnalysis}
              />
            </div>
          </>
        )}
      </div>
    );
  }

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
    </div>
  );
}
