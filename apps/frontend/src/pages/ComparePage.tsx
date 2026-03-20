import { ArrowLeft, GitCompare } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '@/app/store';
import { CompareView } from '@/features/history/components/CompareDrawer';
import { Button } from '@/shared/components/ui/button';

export default function ComparePage() {
  const [params] = useSearchParams();
  const history = useStore(s => s.history);

  const ids = (params.get('ids') ?? '').split(',').filter(Boolean);
  const entries = ids.map(id => history.find(h => h.id === id)).filter(Boolean) as NonNullable<
    (typeof history)[number]
  >[];

  if (entries.length < 2) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <GitCompare size={36} className="text-muted-foreground/40" />
        <div>
          <p className="text-sm font-medium text-foreground">Nothing to compare</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Select two entries from History to compare them side-by-side.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/history">Go to History</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Link to="/history">
            <ArrowLeft size={14} />
            History
          </Link>
        </Button>
        <h1 className="text-xl font-semibold text-foreground">Compare</h1>
      </div>
      <CompareView entry1={entries[0]} entry2={entries[1]} />
    </div>
  );
}
