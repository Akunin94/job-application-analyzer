import { Moon, Sun } from 'lucide-react';
import { useLocalStorage } from '@/shared/hooks/useLocalStorage';
import { cn } from '@/shared/lib/cn';

export function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('theme', 'dark');

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        'rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
      )}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
