import { Plus, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { BATCH_MAX_JOBS, BatchJobInput, emptyJob } from '../types';

interface Props {
  jobs: BatchJobInput[];
  onChange: (jobs: BatchJobInput[]) => void;
  disabled: boolean;
}

export function BatchJobEditor({ jobs, onChange, disabled }: Props) {
  const patch = (id: string, fields: Partial<BatchJobInput>) =>
    onChange(jobs.map(job => (job.id === id ? { ...job, ...fields } : job)));

  const remove = (id: string) => onChange(jobs.filter(job => job.id !== id));

  return (
    <div className="space-y-3">
      {jobs.map((job, index) => (
        <div key={job.id} className="space-y-2 rounded-md border border-border p-4">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs font-medium text-muted-foreground">#{index + 1}</span>
            <Input
              aria-label={`Company for posting ${index + 1}`}
              placeholder="Company / job title"
              className="h-8 text-sm"
              disabled={disabled}
              value={job.company}
              onChange={e => patch(job.id, { company: e.target.value })}
            />
            {/* The last posting stays put — an empty batch has nothing to submit
                and the empty state would be a dead end. */}
            {jobs.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label={`Remove posting ${index + 1}`}
                disabled={disabled}
                onClick={() => remove(job.id)}
              >
                <X size={14} />
              </Button>
            )}
          </div>

          <Textarea
            aria-label={`Job posting ${index + 1}`}
            placeholder="Paste the full job description here…"
            rows={5}
            className="resize-none font-mono text-xs"
            disabled={disabled}
            value={job.jobPosting}
            onChange={e => patch(job.id, { jobPosting: e.target.value })}
          />
        </div>
      ))}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          disabled={disabled || jobs.length >= BATCH_MAX_JOBS}
          onClick={() => onChange([...jobs, emptyJob()])}
        >
          <Plus size={13} />
          Add posting
        </Button>
        <Label className="text-xs font-normal text-muted-foreground">
          {jobs.length} / {BATCH_MAX_JOBS}
        </Label>
      </div>
    </div>
  );
}
