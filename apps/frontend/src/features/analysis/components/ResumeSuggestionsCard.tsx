import { useState } from 'react';
import { ChevronDown, ChevronUp, FileEdit } from 'lucide-react';
import { AnalysisResult } from '@/app/store';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

type Suggestion = NonNullable<AnalysisResult['resumeSuggestions']>[number];

const typeConfig: Record<
  Suggestion['type'],
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  rewrite: { label: 'Rewrite', variant: 'secondary' },
  add: { label: 'Add', variant: 'default' },
  remove: { label: 'Remove', variant: 'destructive' },
  strengthen: { label: 'Strengthen', variant: 'outline' },
};

interface ResumeSuggestionsCardProps {
  suggestions: NonNullable<AnalysisResult['resumeSuggestions']>;
}

export function ResumeSuggestionsCard({ suggestions }: ResumeSuggestionsCardProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function toggle(i: number) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileEdit size={15} className="text-muted-foreground" />
          Resume Suggestions
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {suggestions.length} edits
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestions.map((s, i) => {
          const isOpen = expanded.has(i);
          const cfg = typeConfig[s.type];
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className="w-full rounded-md border border-border p-3 text-left transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{s.section}</span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge variant={cfg.variant} className="text-xs">
                    {cfg.label}
                  </Badge>
                  {isOpen ? (
                    <ChevronUp size={14} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={14} className="text-muted-foreground" />
                  )}
                </div>
              </div>

              {isOpen && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  {s.current && (
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Current</p>
                      <p className="rounded bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground line-through">
                        {s.current}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">
                      {s.type === 'remove' ? 'Why remove' : 'Suggested'}
                    </p>
                    <p className="rounded bg-muted/50 px-2 py-1.5 text-xs">
                      {s.type === 'remove' ? s.reason : s.suggestion}
                    </p>
                  </div>
                  {s.type !== 'remove' && (
                    <p className="text-xs text-muted-foreground">💡 {s.reason}</p>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
