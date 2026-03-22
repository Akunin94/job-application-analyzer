import { Building2, Info } from 'lucide-react';
import { AnalysisResult } from '@/app/store';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

type CompanyResearch = NonNullable<AnalysisResult['companyResearch']>;

const confidenceVariant: Record<
  CompanyResearch['confidence'],
  'default' | 'secondary' | 'outline'
> = {
  high: 'default',
  medium: 'secondary',
  low: 'outline',
};

interface CompanyResearchCardProps {
  research: CompanyResearch;
}

export function CompanyResearchCard({ research }: CompanyResearchCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Building2 size={15} className="text-muted-foreground" />
          {research.name}
          <Badge variant={confidenceVariant[research.confidence]} className="ml-auto text-xs">
            {research.confidence} confidence
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{research.overview}</p>

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="mb-0.5 text-xs text-muted-foreground">Industry</p>
            <p className="font-medium">{research.industry}</p>
          </div>
          <div>
            <p className="mb-0.5 text-xs text-muted-foreground">Size</p>
            <p className="font-medium">{research.size}</p>
          </div>
          <div>
            <p className="mb-0.5 text-xs text-muted-foreground">Funding</p>
            <p className="font-medium">{research.funding}</p>
          </div>
        </div>

        {research.techStack.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">Known Tech Stack</p>
            <div className="flex flex-wrap gap-1.5">
              {research.techStack.map(t => (
                <Badge key={t} variant="secondary" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {research.culture.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">Culture</p>
            <ul className="space-y-1">
              {research.culture.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-0.5 shrink-0 text-muted-foreground/50">·</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {research.interviewProcess && (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Interview Process</p>
            <p className="text-sm text-muted-foreground">{research.interviewProcess}</p>
          </div>
        )}

        <div className="flex items-start gap-1.5 rounded-md border border-border bg-muted/30 px-3 py-2">
          <Info size={12} className="mt-0.5 shrink-0 text-muted-foreground/60" />
          <p className="text-xs text-muted-foreground/70">{research.disclaimer}</p>
        </div>
      </CardContent>
    </Card>
  );
}
