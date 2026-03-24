import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { ResumeUploader } from '../../resume/components/ResumeUploader';
import { useResumeStore } from '../../resume/hooks/useResumeStore';
import { AnalysisFormValues, analysisFormSchema } from '../schemas/analysis.schema';

const LANGUAGES = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'English', label: 'English' },
  { value: 'Russian', label: 'Russian' },
  { value: 'German', label: 'German' },
  { value: 'French', label: 'French' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Korean', label: 'Korean' },
];

interface AnalysisFormProps {
  onSubmit: (values: AnalysisFormValues) => void;
  isLoading: boolean;
  defaultJobPosting?: string;
  defaultCompany?: string;
}

export function AnalysisForm({
  onSubmit,
  isLoading,
  defaultJobPosting,
  defaultCompany,
}: AnalysisFormProps) {
  const { hasResume } = useResumeStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisFormSchema),
    defaultValues: {
      language: 'auto',
      jobPosting: defaultJobPosting ?? '',
      company: defaultCompany ?? '',
    },
  });

  const language = watch('language');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>Resume</Label>
        <ResumeUploader />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company / Job Title</Label>
        <Input
          id="company"
          placeholder="e.g. Acme Corp — Senior Engineer"
          disabled={isLoading}
          {...register('company')}
        />
      </div>

      <div className="space-y-2">
        <Label>Output Language</Label>
        <Select value={language} onValueChange={(val: string) => setValue('language', val)}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map(l => (
              <SelectItem key={l.value} value={l.value}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
