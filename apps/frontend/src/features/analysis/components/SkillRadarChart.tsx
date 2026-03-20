import { motion } from 'framer-motion';
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { AnalysisResult } from '@/app/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface SkillRadarChartProps {
  categoryScores: AnalysisResult['categoryScores'];
}

export function SkillRadarChart({ categoryScores }: SkillRadarChartProps) {
  const data = [
    { subject: 'Technical', score: categoryScores.technicalSkills },
    { subject: 'Experience', score: categoryScores.experience },
    { subject: 'Culture', score: categoryScores.cultureFit },
    { subject: 'Keywords', score: categoryScores.keywords },
    { subject: 'Seniority', score: categoryScores.seniority },
    { subject: 'Tools', score: categoryScores.tools },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <PolarGrid />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Radar
                dataKey="score"
                fill="hsl(var(--primary))"
                fillOpacity={0.25}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'hsl(var(--foreground))',
                }}
                formatter={v => [`${v ?? 0}`, 'Score']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </CardContent>
    </Card>
  );
}
