import { Bot, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { AnalysisResult } from '@/app/store';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

type AtsScore = NonNullable<AnalysisResult['atsScore']>;

const verdictConfig = {
  likely_pass: {
    label: 'Likely to pass ATS',
    icon: CheckCircle2,
    color: 'text-green-500',
    badge: 'default' as const,
  },
  borderline: {
    label: 'Borderline',
    icon: AlertCircle,
    color: 'text-yellow-500',
    badge: 'secondary' as const,
  },
  likely_reject: {
    label: 'Likely to be rejected',
    icon: XCircle,
    color: 'text-destructive',
    badge: 'destructive' as const,
  },
};

interface AtsScoreCardProps {
  atsScore: AtsScore;
}

export function AtsScoreCard({ atsScore }: AtsScoreCardProps) {
  const { score, verdict, missingKeywords, formattingTips } = atsScore;
  const cfg = verdictConfig[verdict];
  const Icon = cfg.icon;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Bot size={15} className="text-muted-foreground" />
          ATS Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={16} className={cfg.color} />
            <span className="text-sm font-medium">{cfg.label}</span>
          </div>
          <Badge variant={cfg.badge}>{score}/100</Badge>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${score}%`,
              backgroundColor:
                verdict === 'likely_pass'
                  ? 'rgb(34 197 94)'
                  : verdict === 'borderline'
                    ? 'rgb(234 179 8)'
                    : 'hsl(var(--destructive))',
            }}
          />
        </div>

        {missingKeywords.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">Missing keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {missingKeywords.map(kw => (
                <Badge key={kw} variant="outline" className="text-xs">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {formattingTips.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">Formatting tips</p>
            <ul className="space-y-1">
              {formattingTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-0.5 shrink-0 text-yellow-500">›</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
