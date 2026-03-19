import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { ResumeUploader } from '../../resume/components/ResumeUploader';
import { useResumeStore } from '../../resume/hooks/useResumeStore';
import { AnalysisFormValues, analysisFormSchema } from '../schemas/analysis.schema';

interface AnalysisFormProps {
  onSubmit: (values: AnalysisFormValues) => void;
  isLoading: boolean;
}

export function AnalysisForm({ onSubmit, isLoading }: AnalysisFormProps) {
  const { hasResume } = useResumeStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisFormSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>Resume</Label>
        <ResumeUploader />
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobPosting">Job Posting</Label>
        <Textarea
          id="jobPosting"
          placeholder="Paste the full job description here…"
          rows={12}
          className="resize-none font-mono text-xs"
          disabled={isLoading}
          {...register('jobPosting')}
        />
        {errors.jobPosting && (
          <p className="text-xs text-destructive">{errors.jobPosting.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isLoading || !hasResume} className="w-full gap-2">
        {isLoading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Analyzing…
          </>
        ) : (
          <>
            <Sparkles size={15} />
            Analyze Match
          </>
        )}
      </Button>

      {!hasResume && (
        <p className="text-center text-xs text-muted-foreground">Upload your resume to continue</p>
      )}
    </form>
  );
}
