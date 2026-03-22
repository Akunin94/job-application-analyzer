import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { AnalysisResult } from '@/app/store';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

type Question = NonNullable<AnalysisResult['interviewPrep']>[number];

const categoryColor: Record<Question['category'], string> = {
  technical: 'text-blue-400',
  behavioral: 'text-purple-400',
  situational: 'text-yellow-400',
  'culture-fit': 'text-green-400',
};

const difficultyVariant: Record<Question['difficulty'], 'outline' | 'secondary' | 'destructive'> = {
  easy: 'outline',
  medium: 'secondary',
  hard: 'destructive',
};

interface InterviewPrepCardProps {
  questions: NonNullable<AnalysisResult['interviewPrep']>;
}

export function InterviewPrepCard({ questions }: InterviewPrepCardProps) {
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
          <MessageSquare size={15} className="text-muted-foreground" />
          Interview Prep
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {questions.length} questions
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {questions.map((q, i) => {
          const isOpen = expanded.has(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className="w-full rounded-md border border-border p-3 text-left transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm leading-snug">{q.question}</span>
                <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                  <span className={`text-xs font-medium capitalize ${categoryColor[q.category]}`}>
                    {q.category}
                  </span>
                  <Badge variant={difficultyVariant[q.difficulty]} className="text-xs">
                    {q.difficulty}
                  </Badge>
                  {isOpen ? (
                    <ChevronUp size={14} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={14} className="text-muted-foreground" />
                  )}
                </div>
              </div>
              {isOpen && (
                <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
                  💡 {q.tip}
                </p>
              )}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
