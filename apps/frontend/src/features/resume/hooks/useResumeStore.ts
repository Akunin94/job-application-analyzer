import { useStore } from '@/app/store';

/**
 * Reading side stays what it always was — `resumeText` is whichever version is
 * selected — so pages that just want "the resume" never learn about versions.
 */
export function useResumeStore() {
  const resumes = useStore(s => s.resumes);
  const activeResumeId = useStore(s => s.activeResumeId);
  const addResume = useStore(s => s.addResume);
  const selectResume = useStore(s => s.selectResume);
  const renameResume = useStore(s => s.renameResume);
  const removeResume = useStore(s => s.removeResume);
  const clearResumes = useStore(s => s.clearResumes);

  const active = resumes.find(r => r.id === activeResumeId) ?? null;

  return {
    resumes,
    active,
    activeResumeId,
    resumeText: active?.text ?? '',
    resumeFileName: active?.fileName ?? '',
    hasResume: active !== null,
    addResume,
    selectResume,
    renameResume,
    removeResume,
    clearResumes,
  };
}
