import { useStore } from '@/app/store';

export function useAnalysisHistory() {
  const history = useStore(s => s.history);
  const addToHistory = useStore(s => s.addToHistory);
  const removeFromHistory = useStore(s => s.removeFromHistory);
  const clearHistory = useStore(s => s.clearHistory);

  return { history, addToHistory, removeFromHistory, clearHistory };
}
