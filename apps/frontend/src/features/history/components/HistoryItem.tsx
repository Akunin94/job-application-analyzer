import { GitCompare, Trash2 } from 'lucide-react';
import { HistoryEntry } from '@/app/store';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/cn';

interface HistoryItemProps {
  entry: HistoryEntry;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function HistoryItem({ entry, isSelected, onToggleSelect, onRemove }: HistoryItemProps) {
  const { matchScore, confidence } = entry.result;
  const scoreColor =
    matchScore >= 70 ? 'text-green-500' : matchScore >= 50 ? 'text-yellow-500' : 'text-red-500';

  const confidenceVariant =
    confidence === 'high' ? 'default' : confidence === 'medium' ? 'secondary' : 'outline';

  return (
    <Card className={cn('transition-all', isSelected && 'ring-1 ring-primary')}>
      <CardContent className="flex items-center gap-4 p-4">
        <button
          onClick={() => onToggleSelect(entry.id)}
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
            isSelected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border hover:border-primary',
          )}
          aria-label="Select for comparison"
        >
          {isSelected && (
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor">
              <path
                d="M10 3L5 8.5 2 5.5"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{entry.company}</p>
          <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
        </div>

        <span className={cn('text-2xl font-bold tabular-nums', scoreColor)}>{matchScore}</span>

        <Badge variant={confidenceVariant} className="capitalize">
          {confidence}
        </Badge>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(entry.id)}
          aria-label="Remove"
        >
          <Trash2 size={14} />
        </Button>

        <Button
          variant={isSelected ? 'secondary' : 'ghost'}
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground"
          onClick={() => onToggleSelect(entry.id)}
          aria-label="Select for comparison"
        >
          <GitCompare size={14} />
        </Button>
      </CardContent>
    </Card>
  );
}
