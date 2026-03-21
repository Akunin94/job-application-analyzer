import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { AnalysisResult } from '@/app/store';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/cn';

type RedFlag = AnalysisResult['redFlags'][number];

interface RedFlagListProps {
  flags: RedFlag[];
}

export function RedFlagList({ flags }: RedFlagListProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  if (flags.length === 0) {
    return <p className="text-sm text-muted-foreground">No red flags detected.</p>;
  }

  const toggle = (i: number) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <ul className="space-y-2">
      {flags.map((rf, i) => {
        const isOpen = expanded.has(i);
        return (
          <li key={i} className="rounded-md border border-border bg-card/50">
            <button
              type="button"
              onClick={() => toggle(i)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="shrink-0 text-destructive">⚑</span>
                <span className="text-foreground">{rf.flag}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge
                  variant={rf.severity === 'critical' ? 'destructive' : 'outline'}
                  className="text-xs capitalize"
                >
                  {rf.severity}
                </Badge>
                {rf.quote && (
                  <ChevronDown
                    size={14}
                    className={cn(
                      'text-muted-foreground transition-transform duration-200',
                      isOpen && 'rotate-180',
                    )}
                  />
                )}
              </div>
            </button>

            {isOpen && rf.quote && (
              <blockquote className="border-t border-border px-3 py-2">
                <p className="text-xs italic text-muted-foreground">&ldquo;{rf.quote}&rdquo;</p>
              </blockquote>
            )}
          </li>
        );
      })}
    </ul>
  );
}
