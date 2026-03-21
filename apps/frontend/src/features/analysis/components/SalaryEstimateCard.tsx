import { Banknote } from 'lucide-react';
import { AnalysisResult } from '@/app/store';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

type SalaryEstimate = NonNullable<AnalysisResult['salaryEstimate']>;

interface SalaryEstimateCardProps {
  estimate: SalaryEstimate;
}

function formatAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

const CONFIDENCE_VARIANT: Record<
  SalaryEstimate['confidence'],
  'default' | 'secondary' | 'outline'
> = {
  high: 'default',
  medium: 'secondary',
  low: 'outline',
};

export function SalaryEstimateCard({ estimate }: SalaryEstimateCardProps) {
  const { min, max, currency, period, confidence, notes } = estimate;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Banknote size={15} className="text-muted-foreground" />
            Salary Estimate
          </div>
          <Badge variant={CONFIDENCE_VARIANT[confidence]} className="capitalize">
            {confidence} confidence
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums text-foreground">
          {formatAmount(min, currency)}
          <span className="mx-2 font-normal text-muted-foreground">–</span>
          {formatAmount(max, currency)}
          <span className="ml-1.5 text-sm font-normal text-muted-foreground">/ {period}</span>
        </p>
        {notes && <p className="mt-2 text-xs text-muted-foreground">{notes}</p>}
      </CardContent>
    </Card>
  );
}
