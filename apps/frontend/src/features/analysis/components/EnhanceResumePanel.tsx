import { CheckCircle2, ChevronDown, ChevronUp, Download, Loader2, Wand2 } from 'lucide-react';
import { lazy, Suspense, useMemo, useState } from 'react';
import type { AnalysisResult } from '@/app/store';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/cn';
import type { EnhancedResume } from './EnhancedResumePdf';

const PDFDownloadLink = lazy(() =>
  import('@react-pdf/renderer').then(m => ({ default: m.PDFDownloadLink })),
);
const EnhancedResumePdf = lazy(() =>
  import('./EnhancedResumePdf').then(m => ({ default: m.EnhancedResumePdf })),
);

const API_URL = import.meta.env.VITE_API_URL as string;

interface Improvement {
  id: string;
  label: string;
  detail: string;
  badge: string;
  badgeVariant: 'destructive' | 'default' | 'secondary' | 'outline';
}

function buildImprovements(result: AnalysisResult): Improvement[] {
  const items: Improvement[] = [];

  // From resumeSuggestions
  if (result.resumeSuggestions) {
    for (const s of result.resumeSuggestions) {
      const typeLabel =
        s.type === 'add'
          ? 'Add'
          : s.type === 'rewrite'
            ? 'Rewrite'
            : s.type === 'strengthen'
              ? 'Strengthen'
              : 'Remove';
      items.push({
        id: `suggestion-${items.length}`,
        label: `[${s.section}] ${typeLabel}: ${s.suggestion.slice(0, 80)}${s.suggestion.length > 80 ? '…' : ''}`,
        detail: s.reason,
        badge: s.type,
        badgeVariant: s.type === 'add' ? 'default' : s.type === 'rewrite' ? 'secondary' : 'outline',
      });
    }
  }

  // From skillGaps (critical + important only)
  for (const gap of result.skillGaps.filter(g => g.priority !== 'nice-to-have')) {
    items.push({
      id: `gap-${gap.skill}`,
      label: `Add "${gap.skill}" to skills/experience`,
      detail: gap.context,
      badge: gap.priority,
      badgeVariant: gap.priority === 'critical' ? 'destructive' : 'default',
    });
  }

  return items;
}

interface Props {
  result: AnalysisResult;
  resumeText: string;
  jobPosting: string;
}

export function EnhanceResumePanel({ result, resumeText, jobPosting }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [enhanced, setEnhanced] = useState<EnhancedResume | null>(null);

  const improvements = useMemo(() => buildImprovements(result), [result]);

  const toggleAll = () => {
    if (selected.size === improvements.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(improvements.map(i => i.id)));
    }
  };

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (selected.size === 0) return;
    setStatus('generating');
    setError('');
    setEnhanced(null);

    const selectedImprovements = improvements.filter(i => selected.has(i.id)).map(i => i.label);

    try {
      const res = await fetch(`${API_URL}/api/analyze/enhance-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobPosting, improvements: selectedImprovements }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const data = (await res.json()) as EnhancedResume;
      setEnhanced(data);
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setStatus('error');
    }
  };

  if (improvements.length === 0) return null;

  return (
    <Card>
      <CardHeader className="cursor-pointer select-none pb-3" onClick={() => setOpen(o => !o)}>
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Wand2 size={15} className="text-indigo-400" />
            Enhance Resume
          </span>
          {open ? (
            <ChevronUp size={15} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={15} className="text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4 pt-0">
          <p className="text-xs text-muted-foreground">
            Select improvements to incorporate, then generate an enhanced version of your resume as
            a PDF.
          </p>

          {/* Select all */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {selected.size} of {improvements.length} selected
            </span>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              {selected.size === improvements.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            {improvements.map(imp => (
              <label
                key={imp.id}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
                  selected.has(imp.id)
                    ? 'border-indigo-500/40 bg-indigo-500/5'
                    : 'border-border hover:border-border/80',
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.has(imp.id)}
                  onChange={() => toggle(imp.id)}
                  className="mt-0.5 accent-indigo-500"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-start gap-2">
                    <Badge variant={imp.badgeVariant} className="shrink-0 text-[10px]">
                      {imp.badge}
                    </Badge>
                    <span className="text-xs leading-snug text-foreground">{imp.label}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{imp.detail}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Generate button */}
          {status !== 'done' && (
            <Button
              className="w-full gap-2 text-xs"
              disabled={selected.size === 0 || status === 'generating'}
              onClick={handleGenerate}
            >
              {status === 'generating' ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Generating enhanced resume…
                </>
              ) : (
                <>
                  <Wand2 size={13} />
                  Generate Enhanced Resume ({selected.size} improvements)
                </>
              )}
            </Button>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          {/* Result */}
          {status === 'done' && enhanced && (
            <div className="space-y-3 rounded-md border border-green-500/20 bg-green-500/5 p-4">
              <div className="flex items-center gap-2 text-xs text-green-500">
                <CheckCircle2 size={14} />
                Enhanced resume ready!
              </div>

              {/* Preview */}
              <div className="max-h-64 overflow-y-auto rounded border border-border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
                <p className="font-semibold text-foreground">{enhanced.name}</p>
                {enhanced.title && <p className="text-indigo-400">{enhanced.title}</p>}
                <p className="mt-0.5 text-[11px]">{enhanced.contact}</p>
                {enhanced.summary && (
                  <p className="mt-2 text-[11px] leading-relaxed">{enhanced.summary}</p>
                )}
                <p className="mt-2 font-semibold text-foreground">
                  Experience ({enhanced.experience.length} positions)
                </p>
                {enhanced.experience.slice(0, 2).map((job, i) => (
                  <p key={i} className="mt-1 text-[11px]">
                    {job.role} @ {job.company} · {job.period}
                  </p>
                ))}
                {enhanced.experience.length > 2 && (
                  <p className="text-[11px] text-muted-foreground">
                    +{enhanced.experience.length - 2} more…
                  </p>
                )}
              </div>

              {/* Download */}
              <Suspense fallback={null}>
                <PDFDownloadLink
                  document={<EnhancedResumePdf resume={enhanced} />}
                  fileName={`${enhanced.name.replace(/\s+/g, '-')}-enhanced-resume.pdf`}
                >
                  {({ loading }) => (
                    <Button size="sm" className="w-full gap-2 text-xs" disabled={loading}>
                      <Download size={13} />
                      {loading ? 'Preparing PDF…' : 'Download Enhanced Resume PDF'}
                    </Button>
                  )}
                </PDFDownloadLink>
              </Suspense>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={() => {
                  setStatus('idle');
                  setEnhanced(null);
                }}
              >
                Generate again with different improvements
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
