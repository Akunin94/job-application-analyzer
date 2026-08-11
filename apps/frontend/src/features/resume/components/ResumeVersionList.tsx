import { Check, FileText, Pencil, X } from 'lucide-react';
import { useState } from 'react';
import { ResumeVersion } from '@/app/store';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/cn';
import { useResumeStore } from '../hooks/useResumeStore';

function formatAdded(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function VersionRow({ version, isActive }: { version: ResumeVersion; isActive: boolean }) {
  const { selectResume, renameResume, removeResume } = useResumeStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(version.name);

  const commit = () => {
    renameResume(version.id, draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-card p-2.5">
        <Input
          autoFocus
          aria-label={`Name for ${version.fileName}`}
          className="h-7 flex-1 text-sm"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(version.name);
              setEditing(false);
            }
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          aria-label="Save name"
          onClick={commit}
        >
          <Check size={14} />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border p-2.5 transition-colors',
        isActive
          ? 'border-primary/40 bg-primary/5'
          : 'border-border bg-card hover:border-border/80',
      )}
    >
      <input
        type="radio"
        name="resume-version"
        className="shrink-0 accent-indigo-500"
        aria-label={`Use ${version.name}`}
        checked={isActive}
        onChange={() => selectResume(version.id)}
      />
      <FileText size={15} className="shrink-0 text-muted-foreground" />
      <button
        type="button"
        onClick={() => selectResume(version.id)}
        className="min-w-0 flex-1 text-left"
      >
        <span className="block truncate text-sm text-foreground">{version.name}</span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {version.fileName} · added {formatAdded(version.addedAt)}
        </span>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        aria-label={`Rename ${version.name}`}
        onClick={() => {
          setDraft(version.name);
          setEditing(true);
        }}
      >
        <Pencil size={13} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        aria-label={`Remove ${version.name}`}
        onClick={() => removeResume(version.id)}
      >
        <X size={14} />
      </Button>
    </div>
  );
}

export function ResumeVersionList() {
  const { resumes, activeResumeId } = useResumeStore();

  if (resumes.length === 0) return null;

  return (
    <div className="space-y-2">
      {resumes.map(version => (
        <VersionRow key={version.id} version={version} isActive={version.id === activeResumeId} />
      ))}
    </div>
  );
}
