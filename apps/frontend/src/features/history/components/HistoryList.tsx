import { Clock } from 'lucide-react';
import { HistoryEntry } from '@/app/store';
import { HistoryItem } from './HistoryItem';

interface HistoryListProps {
  entries: HistoryEntry[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export function HistoryList({ entries, selectedIds, onToggleSelect, onRemove }: HistoryListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Clock size={32} className="text-muted-foreground/40" />
        <div>
          <p className="text-sm font-medium text-foreground">No analyses yet</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Run your first job analysis to see results here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {entries.map(entry => (
        <li key={entry.id}>
          <HistoryItem
            entry={entry}
            isSelected={selectedIds.includes(entry.id)}
            onToggleSelect={onToggleSelect}
            onRemove={onRemove}
          />
        </li>
      ))}
    </ul>
  );
}
