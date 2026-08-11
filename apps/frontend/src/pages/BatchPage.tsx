import { Layers, Loader2, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BatchJobEditor } from '@/features/batch/components/BatchJobEditor';
import { BatchResultTable } from '@/features/batch/components/BatchResultTable';
import { useBatchAnalysis } from '@/features/batch/hooks/useBatchAnalysis';
import { BatchJobInput, emptyJob } from '@/features/batch/types';
import { ResumeUploader } from '@/features/resume/components/ResumeUploader';
import { useResumeStore } from '@/features/resume/hooks/useResumeStore';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';

export default function BatchPage() {
  const { resumeText, hasResume } = useResumeStore();
  const [jobs, setJobs] = useState<BatchJobInput[]>(() => [emptyJob(), emptyJob()]);
  const { status, rows, isRanked, error, start, abort } = useBatchAnalysis();

  const isLoading = status === 'connecting' || status === 'streaming';

  // Blank postings are dropped rather than rejected — half-filled cards are how
  // this form is normally left while the user pastes the next one in.
  const filledJobs = useMemo(() => jobs.filter(job => job.jobPosting.trim().length > 0), [jobs]);

  const handleStart = () => start(resumeText, filledJobs);

  const doneCount = rows.filter(row => row.status === 'done' || row.status === 'error').length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <Layers size={18} className="text-indigo-400" />
          Batch Analysis
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Run one resume against several postings at once and see them ranked by match score.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <p className="font-medium">Batch analysis failed</p>
          <p className="mt-0.5 text-destructive/90">{error}</p>
        </div>
      )}

      <Card className="space-y-6 p-6">
        <div className="space-y-2">
          <Label>Resume</Label>
          <ResumeUploader />
        </div>

        <div className="space-y-2">
          <Label>Job postings</Label>
          <BatchJobEditor jobs={jobs} onChange={setJobs} disabled={isLoading} />
        </div>

        {isLoading ? (
          <Button variant="outline" className="w-full gap-2" onClick={abort}>
            <Loader2 size={15} className="animate-spin" />
            Analyzing {doneCount} / {rows.length} — cancel
          </Button>
        ) : (
          <Button
            className="w-full gap-2"
            disabled={!hasResume || filledJobs.length === 0}
            onClick={handleStart}
          >
            <Sparkles size={15} />
            Analyze {filledJobs.length || ''} {filledJobs.length === 1 ? 'posting' : 'postings'}
          </Button>
        )}

        {!hasResume && (
          <p className="text-center text-xs text-muted-foreground">
            Upload your resume to continue
          </p>
        )}
      </Card>

      {rows.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-medium text-foreground">
            {isRanked ? 'Ranked by match score' : 'Results'}
          </h2>
          <BatchResultTable rows={rows} isRanked={isRanked} />
        </div>
      )}
    </div>
  );
}
