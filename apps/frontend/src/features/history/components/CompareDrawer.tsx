import { HistoryEntry } from '@/app/store';
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Separator } from '@/shared/components/ui/separator';
import { cn } from '@/shared/lib/cn';

interface CompareDrawerProps {
  entry1: HistoryEntry;
  entry2: HistoryEntry;
  open: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  technicalSkills: 'Technical',
  experience: 'Experience',
  cultureFit: 'Culture Fit',
  keywords: 'Keywords',
  seniority: 'Seniority',
  tools: 'Tools',
};

function scoreColor(n: number) {
  return n >= 70 ? 'text-green-500' : n >= 50 ? 'text-yellow-500' : 'text-red-500';
}

function CompareColumn({ entry }: { entry: HistoryEntry }) {
  const { matchScore, confidence, categoryScores, strengths, skillGaps } = entry.result;

  return (
    <div className="space-y-4">
      <div>
        <p className="truncate font-medium text-foreground">{entry.company}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(entry.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      <div className="flex items-baseline gap-2">
        <span className={cn('text-5xl font-bold tabular-nums', scoreColor(matchScore))}>
          {matchScore}
        </span>
        <span className="text-sm text-muted-foreground">/ 100</span>
        <Badge
          variant={
            confidence === 'high' ? 'default' : confidence === 'medium' ? 'secondary' : 'outline'
          }
          className="ml-1 capitalize"
        >
          {confidence}
        </Badge>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Categories
        </p>
        <div className="space-y-1.5">
          {Object.entries(categoryScores).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[key] ?? key}</span>
              <span className={cn('text-xs font-semibold tabular-nums', scoreColor(val))}>
                {val}
              </span>
            </div>
          ))}
        </div>
      </div>

      {strengths.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Top Strengths
          </p>
          <ul className="space-y-1">
            {strengths.slice(0, 3).map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <span className="mt-0.5 text-green-500">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {skillGaps.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Top Gaps
          </p>
          <ul className="space-y-1">
            {skillGaps.slice(0, 3).map(gap => (
              <li key={gap.skill} className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-foreground">{gap.skill}</span>
                <Badge
                  variant={
                    gap.priority === 'critical'
                      ? 'destructive'
                      : gap.priority === 'important'
                        ? 'default'
                        : 'secondary'
                  }
                  className="text-xs"
                >
                  {gap.priority}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function CompareDrawer({ entry1, entry2, open, onClose }: CompareDrawerProps) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Compare Analyses</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="grid grid-cols-2 gap-6 pr-4">
            <CompareColumn entry={entry1} />
            <div className="relative">
              <Separator orientation="vertical" className="absolute -left-3 h-full" />
              <CompareColumn entry={entry2} />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function CompareView({ entry1, entry2 }: { entry1: HistoryEntry; entry2: HistoryEntry }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <Card className="p-5">
        <CompareColumn entry={entry1} />
      </Card>
      <Card className="p-5">
        <CompareColumn entry={entry2} />
      </Card>
    </div>
  );
}
