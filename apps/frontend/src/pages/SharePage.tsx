import { BrainCircuit } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnalysisResultDashboard } from '@/features/analysis/components/AnalysisResult';
import { Button } from '@/shared/components/ui/button';
import { decodeAnalysis } from '@/shared/lib/share';

export default function SharePage() {
  const [params] = useSearchParams();
  const encoded = params.get('d');
  const result = encoded ? decodeAnalysis(encoded) : null;

  if (!result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <p className="text-muted-foreground">Invalid or expired share link.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <BrainCircuit size={16} />
            AI Job Analyzer
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/analyze">Run your own analysis →</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Shared Analysis</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This analysis was shared with you. Results are read-only.
          </p>
        </div>
        <AnalysisResultDashboard result={result} />
      </main>
    </div>
  );
}
