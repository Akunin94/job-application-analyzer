import { useStore } from '@/app/store';

export function useResumeStore() {
  const resumeText = useStore(s => s.resumeText);
  const resumeFileName = useStore(s => s.resumeFileName);
  const setResume = useStore(s => s.setResume);
  const clearResume = useStore(s => s.clearResume);

  return {
    resumeText,
    resumeFileName,
    setResume,
    clearResume,
    hasResume: resumeText.length > 0,
  };
}
