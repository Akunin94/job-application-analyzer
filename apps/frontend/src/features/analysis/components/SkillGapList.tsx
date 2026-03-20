import { AnalysisResult } from '@/app/store';
import { Badge } from '@/shared/components/ui/badge';

type SkillGap = AnalysisResult['skillGaps'][number];

interface SkillGapListProps {
  gaps: SkillGap[];
}

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', variant: 'destructive' as const },
  important: { label: 'Important', variant: 'default' as const },
  'nice-to-have': { label: 'Nice to have', variant: 'secondary' as const },
};

const PRIORITY_ORDER: SkillGap['priority'][] = ['critical', 'important', 'nice-to-have'];

export function SkillGapList({ gaps }: SkillGapListProps) {
  if (gaps.length === 0) {
    return <p className="text-sm text-muted-foreground">No significant skill gaps identified.</p>;
  }

  const sorted = [...gaps].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
  );

  return (
    <ul className="space-y-3">
      {sorted.map(gap => {
        const { label, variant } = PRIORITY_CONFIG[gap.priority];
        return (
          <li key={gap.skill} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{gap.skill}</span>
              <Badge variant={variant} className="text-xs">
                {label}
              </Badge>
            </div>
            {gap.context && <p className="text-xs text-muted-foreground">{gap.context}</p>}
          </li>
        );
      })}
    </ul>
  );
}
