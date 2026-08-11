import { ArrowLeft, Check, Download, Link } from 'lucide-react';
import { lazy, Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '@/app/store';
import { AnalysisForm } from '@/features/analysis/components/AnalysisForm';
import {
  AnalysisResultDashboard,
  AnalysisResultSkeleton,
} from '@/features/analysis/components/AnalysisResult';
import { FollowUpEmailPanel } from '@/features/analysis/components/FollowUpEmailPanel';
import { StreamingOutput } from '@/features/analysis/components/StreamingOutput';
import { useStreamAnalysis } from '@/features/analysis/hooks/useStreamAnalysis';
import { AnalysisFormValues } from '@/features/analysis/schemas/analysis.schema';
import { useResumeStore } from '@/features/resume/hooks/useResumeStore';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import { GeneratePanel } from '@/features/generate/components/GeneratePanel';
import { WebhookExportButton } from '@/features/analysis/components/WebhookExportButton';
import { AnalysisPdfDocument } from '@/features/analysis/components/AnalysisPdfDocument';
import { buildShareUrl, decodeJobPosting } from '@/shared/lib/share';

const PDFDownloadLink = lazy(() =>
  import('@react-pdf/renderer').then(m => ({ default: m.PDFDownloadLink })),
);

export default function AnalyzePage() {
  const { resumeText } = useResumeStore();
  const currentAnalysis = useStore(s => s.currentAnalysis);
  const { status, error, start } = useStreamAnalysis();
  const [showForm, setShowForm] = useState(!currentAnalysis);
  const [searchParams] = useSearchParams();

  // Pre-fill from browser extension (?job=<lz-compressed>&company=<name>)
  const prefillJob = useMemo(() => {
    const encoded = searchParams.get('job');
    return encoded ? (decodeJobPosting(encoded) ?? '') : '';
  }, [searchParams]);
  const prefillCompany = searchParams.get('company') ?? '';
  const [jobPosting, setJobPosting] = useState('');
  const [language, setLanguage] = useState('auto');
  const [company, setCompany] = useState('');
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = async () => {
    if (!currentAnalysis) return;
    const url = buildShareUrl(currentAnalysis);
    await navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const isLoading = status === 'connecting' || status === 'streaming';

  const handleSubmit = async (values: AnalysisFormValues) => {
    setJobPosting(values.jobPosting);
    setLanguage(values.language ?? 'auto');
    setCompany(values.company ?? '');
    setShowForm(false);
    await start(
      resumeText,
      values.jobPosting,
      values.company ?? 'Unknown Company',
      values.language ?? 'auto',
    );
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

  // On error fall through to the form so the banner is visible, even when a
  // previous analysis is still in the store.
  if (!showForm && currentAnalysis && !error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Analysis Results</h1>
          <div className="flex items-center gap-2">
            <Suspense fallback={null}>
              <PDFDownloadLink
                document={<AnalysisPdfDocument result={currentAnalysis} company={company} />}
                fileName={`analysis-${company.replace(/\s+/g, '-').toLowerCase() || 'report'}.pdf`}
              >
                {({ loading }) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-muted-foreground"
                    disabled={loading}
                  >
                    <Download size={13} />
                    {loading ? 'Preparing…' : 'PDF'}
                  </Button>
                )}
              </PDFDownloadLink>
            </Suspense>
            <WebhookExportButton analysis={currentAnalysis} company={company} />
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground"
              onClick={handleShare}
            >
              {shareCopied ? <Check size={13} /> : <Link size={13} />}
              {shareCopied ? 'Copied!' : 'Share'}
            </Button>
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
        </div>
        <AnalysisResultDashboard result={currentAnalysis} />
        {jobPosting && (
          <>
            <Separator className="my-6" />
            <div className="space-y-4">
              <GeneratePanel
                result={currentAnalysis}
                resumeText={resumeText}
                jobPosting={jobPosting}
                company={company}
                language={language}
              />
              <FollowUpEmailPanel
                resumeText={resumeText}
                jobPosting={jobPosting}
                analysis={currentAnalysis}
                language={language}
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
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <p className="font-medium">Analysis failed</p>
          <p className="mt-0.5 text-destructive/90">{error}</p>
        </div>
      )}

      <Card className="p-6">
        <AnalysisForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          defaultJobPosting={prefillJob}
          defaultCompany={prefillCompany}
        />
      </Card>
    </div>
  );
}
