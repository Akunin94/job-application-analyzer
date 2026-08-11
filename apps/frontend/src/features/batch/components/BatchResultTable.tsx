import { AlertCircle, Loader2, Trophy } from 'lucide-react';
import { AnalysisResult } from '@/app/store';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/lib/cn';
import { BatchRow } from '../types';

function scoreTone(score: number): string {
  if (score >= 75) return 'text-green-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-destructive';
}

function barTone(score: number): string {
  if (score >= 75) return 'bg-green-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-destructive';
}

function criticalGapCount(result: AnalysisResult): number {
  return result.skillGaps.filter(gap => gap.priority === 'critical').length;
}

function RowBody({ row }: { row: BatchRow }) {
  if (row.status === 'error') {
    return (
      <p className="flex items-start gap-1.5 text-xs text-destructive">
        <AlertCircle size={13} className="mt-0.5 shrink-0" />
        {row.error}
      </p>
    );
  }

  if (!row.result) {
    return row.status === 'running' ? (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 size={13} className="animate-spin" />
        Analyzing…
      </div>
    ) : (
      <Skeleton className="h-4 w-40" />
    );
  }

  const { result } = row;
  const critical = criticalGapCount(result);

  return (
    <div className="space-y-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className={cn('h-full rounded-full transition-all', barTone(result.matchScore))}
          style={{ width: `${result.matchScore}%` }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="text-[10px] capitalize">
          {result.confidence} confidence
        </Badge>
        {critical > 0 && (
          <Badge variant="secondary" className="text-[10px] text-destructive">
            {critical} critical gap{critical === 1 ? '' : 's'}
          </Badge>
        )}
        {result.redFlags.length > 0 && (
          <Badge variant="secondary" className="text-[10px] text-amber-500">
            {result.redFlags.length} red flag{result.redFlags.length === 1 ? '' : 's'}
          </Badge>
        )}
        {row.cached && (
          <Badge variant="secondary" className="text-[10px] text-muted-foreground">
            cached
          </Badge>
        )}
      </div>
      <p className="line-clamp-2 text-xs text-muted-foreground">{result.summary}</p>
    </div>
  );
}

interface Props {
  rows: BatchRow[];
  isRanked: boolean;
}

export function BatchResultTable({ rows, isRanked }: Props) {
  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div
          key={row.id}
          className={cn(
            'rounded-md border p-4',
            isRanked && index === 0 && row.result
              ? 'border-green-500/30 bg-green-500/5'
              : 'border-border',
          )}
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {isRanked && index === 0 && row.result && (
                <Trophy size={14} className="shrink-0 text-green-500" />
              )}
              <span className="truncate text-sm font-medium text-foreground">{row.company}</span>
            </div>
            {row.result && (
              <span
                className={cn('shrink-0 text-sm font-semibold', scoreTone(row.result.matchScore))}
              >
                {row.result.matchScore}
              </span>
            )}
          </div>
          <RowBody row={row} />
        </div>
      ))}
    </div>
  );
}
