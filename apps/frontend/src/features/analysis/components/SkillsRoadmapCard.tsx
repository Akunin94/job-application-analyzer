import { BookOpen, Clock, Code2, FileText, GraduationCap, Layers, Map } from 'lucide-react';
import { AnalysisResult } from '@/app/store';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

type RoadmapItem = NonNullable<AnalysisResult['skillsRoadmap']>[number];
type Resource = RoadmapItem['resources'][number];

const priorityVariant: Record<RoadmapItem['priority'], 'destructive' | 'secondary' | 'outline'> = {
  critical: 'destructive',
  important: 'secondary',
  'nice-to-have': 'outline',
};

const resourceIcon: Record<Resource['type'], React.ElementType> = {
  course: GraduationCap,
  docs: FileText,
  book: BookOpen,
  tutorial: Layers,
  practice: Code2,
};

interface SkillsRoadmapCardProps {
  roadmap: NonNullable<AnalysisResult['skillsRoadmap']>;
}

export function SkillsRoadmapCard({ roadmap }: SkillsRoadmapCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Map size={15} className="text-muted-foreground" />
          Skills Roadmap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {roadmap.map((item, i) => (
          <div key={i} className="space-y-2 rounded-md border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{item.skill}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={11} />
                  {item.timeEstimate}
                </span>
                <Badge variant={priorityVariant[item.priority]} className="text-xs">
                  {item.priority}
                </Badge>
              </div>
            </div>
            <ul className="space-y-1">
              {item.resources.map((r, j) => {
                const ResourceIcon = resourceIcon[r.type];
                return (
                  <li key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ResourceIcon size={12} className="shrink-0 text-muted-foreground/60" />
                    {r.title}
                    <span className="ml-auto text-muted-foreground/50">{r.type}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
