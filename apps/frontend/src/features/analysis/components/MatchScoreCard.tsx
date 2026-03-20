import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { AnalysisResult } from '@/app/store';
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/cn';

interface MatchScoreCardProps {
  score: number;
  confidence: AnalysisResult['confidence'];
}

export function MatchScoreCard({ score, confidence }: MatchScoreCardProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, v => Math.round(v));

  useEffect(() => {
    const controls = animate(count, score, { duration: 1.2, ease: 'easeOut' });
    return controls.stop;
  }, [count, score]);

  const scoreColor =
    score >= 70 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500';

  const confidenceVariant =
    confidence === 'high' ? 'default' : confidence === 'medium' ? 'secondary' : 'outline';

  return (
    <Card className="flex flex-col items-center justify-center p-6 text-center">
      <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Match Score</p>
      <motion.span className={cn('text-7xl font-bold tabular-nums leading-none', scoreColor)}>
        {rounded}
      </motion.span>
      <p className="mt-1 text-sm text-muted-foreground">/ 100</p>
      <Badge variant={confidenceVariant} className="mt-4 capitalize">
        {confidence} confidence
      </Badge>
    </Card>
  );
}
