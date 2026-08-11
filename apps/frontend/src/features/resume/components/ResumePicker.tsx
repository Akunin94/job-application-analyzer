import { MAX_RESUME_VERSIONS } from '@/app/store';
import { useResumeStore } from '../hooks/useResumeStore';
import { ResumeUploader } from './ResumeUploader';
import { ResumeVersionList } from './ResumeVersionList';

/**
 * The resume control every form uses: stored versions to pick from, plus the
 * dropzone for adding one. With nothing stored yet it is just the dropzone, so
 * a first-time user sees exactly what they saw before versions existed.
 */
export function ResumePicker() {
  const { resumes } = useResumeStore();
  const hasVersions = resumes.length > 0;

  return (
    <div className="space-y-3">
      <ResumeVersionList />
      <ResumeUploader compact={hasVersions} />
      {resumes.length >= MAX_RESUME_VERSIONS && (
        <p className="text-xs text-muted-foreground">
          Holding the most recent {MAX_RESUME_VERSIONS} versions — adding another drops the oldest.
        </p>
      )}
    </div>
  );
}
