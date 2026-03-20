import { GitCompare, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompareDrawer } from '@/features/history/components/CompareDrawer';
import { HistoryList } from '@/features/history/components/HistoryList';
import { useAnalysisHistory } from '@/features/history/hooks/useAnalysisHistory';
import { Button } from '@/shared/components/ui/button';

export default function HistoryPage() {
  const { history, removeFromHistory, clearHistory } = useAnalysisHistory();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 2 ? [...prev, id] : prev,
    );
  };

  const selectedEntries = selectedIds
    .map(id => history.find(h => h.id === id))
    .filter(Boolean) as (typeof history)[number][];

  const canCompare = selectedEntries.length === 2;

  const openComparePage = () => {
    navigate(`/compare?ids=${selectedIds.join(',')}`);
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">History</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {history.length} {history.length === 1 ? 'analysis' : 'analyses'} saved
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCompare && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setCompareOpen(true)}
              >
                <GitCompare size={14} />
                Compare
              </Button>
              <Button size="sm" className="gap-1.5" onClick={openComparePage}>
                <GitCompare size={14} />
                Full Compare
              </Button>
            </>
          )}
          {history.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-muted-foreground"
              onClick={() => {
                clearHistory();
                setSelectedIds([]);
              }}
            >
              <Trash2 size={14} />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {canCompare && (
        <p className="mb-3 text-xs text-muted-foreground">
          2 entries selected — click Compare to view side-by-side
        </p>
      )}
      {selectedIds.length === 1 && (
        <p className="mb-3 text-xs text-muted-foreground">Select one more entry to compare</p>
      )}

      <HistoryList
        entries={history}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onRemove={id => {
          removeFromHistory(id);
          setSelectedIds(prev => prev.filter(i => i !== id));
        }}
      />

      {canCompare && (
        <CompareDrawer
          entry1={selectedEntries[0]}
          entry2={selectedEntries[1]}
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
        />
      )}
    </div>
  );
}
