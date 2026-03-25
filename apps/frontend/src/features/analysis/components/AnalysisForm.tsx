import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Loader2, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
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
import { fetchJobFromUrl } from '../api/analyze';
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

const LINKEDIN_RE = /linkedin\.com\/jobs\/(view|search)\//i;

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
  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState('');

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

  const handleUrlFetch = async () => {
    if (!urlInput.trim()) return;
    setUrlError('');
    setUrlLoading(true);
    try {
      const data = await fetchJobFromUrl(urlInput.trim());
      setValue('jobPosting', data.jobPosting, { shouldValidate: true });
      if (data.company && !watch('company')) {
        setValue('company', data.company);
      }
      setUrlInput('');
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : 'Failed to fetch job posting.');
    } finally {
      setUrlLoading(false);
    }
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleUrlFetch();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>Resume</Label>
        <ResumeUploader />
      </div>

      {/* LinkedIn URL auto-fill */}
      <div className="space-y-2">
        <Label htmlFor="jobUrl">
          LinkedIn Job URL{' '}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            optional — auto-fills the form
          </span>
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="jobUrl"
              value={urlInput}
              onChange={e => {
                setUrlInput(e.target.value);
                setUrlError('');
              }}
              onKeyDown={handleUrlKeyDown}
              placeholder="https://www.linkedin.com/jobs/view/…"
              className="pl-8 text-sm"
              disabled={isLoading || urlLoading}
            />
            {urlInput && (
              <button
                type="button"
                onClick={() => {
                  setUrlInput('');
                  setUrlError('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={!urlInput.trim() || !LINKEDIN_RE.test(urlInput) || isLoading || urlLoading}
            onClick={handleUrlFetch}
          >
            {urlLoading ? <Loader2 size={13} className="animate-spin" /> : 'Import'}
          </Button>
        </div>
        {urlError && (
          <div className="space-y-1">
            <p className="text-xs text-destructive">{urlError}</p>
            {urlError.toLowerCase().includes('login') && (
              <p className="text-xs text-muted-foreground">
                Open the job posting in your browser, select all text{' '}
                <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">
                  Cmd+A
                </kbd>{' '}
                and paste it into the field below.
              </p>
            )}
          </div>
        )}
        {!urlError && urlInput && !LINKEDIN_RE.test(urlInput) && (
          <p className="text-xs text-muted-foreground">Paste a linkedin.com/jobs/view/… URL</p>
        )}
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
