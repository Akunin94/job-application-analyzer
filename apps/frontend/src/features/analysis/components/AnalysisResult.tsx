import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Lightbulb, TrendingUp } from 'lucide-react';
import { AnalysisResult as AnalysisResultType } from '@/app/store';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { AtsScoreCard } from './AtsScoreCard';
import { MatchScoreCard } from './MatchScoreCard';
import { RedFlagList } from './RedFlagList';
import { SalaryEstimateCard } from './SalaryEstimateCard';
import { SkillGapList } from './SkillGapList';
import { SkillRadarChart } from './SkillRadarChart';
import { SkillsRoadmapCard } from './SkillsRoadmapCard';

interface AnalysisResultDashboardProps {
  result: AnalysisResultType;
}

export function AnalysisResultDashboard({ result }: AnalysisResultDashboardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MatchScoreCard score={result.matchScore} confidence={result.confidence} />
        <SkillRadarChart categoryScores={result.categoryScores} />
      </div>

      {result.salaryEstimate && <SalaryEstimateCard estimate={result.salaryEstimate} />}

      {result.atsScore && <AtsScoreCard atsScore={result.atsScore} />}

      {result.strengths.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle2 size={15} className="text-green-500" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-0.5 shrink-0 text-green-500">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {result.skillGaps.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp size={15} className="text-yellow-500" />
              Skill Gaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SkillGapList gaps={result.skillGaps} />
          </CardContent>
        </Card>
      )}

      {result.skillsRoadmap && result.skillsRoadmap.length > 0 && (
        <SkillsRoadmapCard roadmap={result.skillsRoadmap} />
      )}

      {result.recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lightbulb size={15} className="text-blue-400" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {result.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-0.5 shrink-0 text-blue-400">→</span>
                  {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {result.redFlags.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle size={15} className="text-destructive" />
              Red Flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RedFlagList flags={result.redFlags} />
          </CardContent>
        </Card>
      )}

      {(result.keywords.matched.length > 0 || result.keywords.missing.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Keywords</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.keywords.matched.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs text-muted-foreground">Matched</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.keywords.matched.map(kw => (
                    <Badge key={kw} variant="secondary" className="text-xs">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {result.keywords.missing.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs text-muted-foreground">Missing</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.keywords.missing.map(kw => (
                    <Badge key={kw} variant="outline" className="text-xs">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

export function AnalysisResultSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-6">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-16 w-28" />
            <Skeleton className="h-5 w-20" />
          </div>
        </Card>
        <Card className="p-6">
          <Skeleton className="mb-3 h-3 w-32" />
          <Skeleton className="h-52 w-full" />
        </Card>
      </div>
      <Card className="p-6">
        <Skeleton className="mb-4 h-3 w-20" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </div>
      </Card>
      <Card className="p-6">
        <Skeleton className="mb-4 h-3 w-20" />
        <div className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-4/5" />
        </div>
      </Card>
    </div>
  );
}
