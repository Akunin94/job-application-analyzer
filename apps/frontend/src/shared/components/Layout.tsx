import { BrainCircuit, Clock, GitCompare, Home, Layers } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/analyze', label: 'Analyze', icon: BrainCircuit, end: false },
  { to: '/batch', label: 'Batch', icon: Layers, end: false },
  { to: '/history', label: 'History', icon: Clock, end: false },
  { to: '/compare', label: 'Compare', icon: GitCompare, end: false },
];

export function Layout() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="flex w-56 flex-col border-r border-border bg-card px-3 py-4">
        <div className="mb-6 px-2">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            AI Job Analyzer
          </span>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-1">
          <ThemeToggle />
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
