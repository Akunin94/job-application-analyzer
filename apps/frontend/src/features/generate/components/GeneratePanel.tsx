import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import type { AnalysisResult } from '@/app/store';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/lib/cn';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { useGenerate } from '../hooks/useGenerate';
import { buildTextFile, downloadBlob, slugify } from '../lib/download';
import {
  TARGET_LABELS,
  type GeneratedResume,
  type GenerateResults,
  type GenerateTarget,
} from '../types';
// Deliberately a static import: PDFDownloadLink renders `document` inside
// react-pdf's own reconciler, which knows nothing about React.lazy or Suspense.
// A lazy element throws there, and the crash escapes to the router boundary —
// taking the whole page, and the results the user just waited for, with it.
import { ResumePdf } from './ResumePdf';

const PDFDownloadLink = lazy(() =>
  import('@react-pdf/renderer').then(m => ({ default: m.PDFDownloadLink })),
);

const TARGETS: Array<{ id: GenerateTarget; label: string; hint: string }> = [
  {
    id: 'resume',
    label: TARGET_LABELS.resume,
    hint: 'Same sections, headings and facts — re-prioritised for this posting. Downloads as PDF.',
  },
  {
    id: 'coverLetter',
    label: TARGET_LABELS.coverLetter,
    hint: 'ATS-friendly, 3 paragraphs, built around the matched keywords.',
  },
  {
    id: 'companyEmail',
    label: TARGET_LABELS.companyEmail,
    hint: 'Subject line + short body for the company inbox.',
  },
  {
    id: 'hrMessage',
    label: TARGET_LABELS.hrMessage,
    hint: 'Short LinkedIn/Telegram message ending in one easy question.',
  },
];

const LETTER_CARDS = [
  { id: 'coverLetter', fileSuffix: 'cover-letter' },
  { id: 'companyEmail', fileSuffix: 'email' },
  { id: 'hrMessage', fileSuffix: 'recruiter-message' },
] as const satisfies ReadonlyArray<{ id: GenerateTarget; fileSuffix: string }>;

type LetterTarget = (typeof LETTER_CARDS)[number]['id'];

/**
 * companyEmail lands as {subject, body}; the other two are plain strings. Either
 * may still be mid-stream, in which case the partial buffer is all there is.
 * null means the letter was not requested — nothing to render for it.
 */
function letterContent(
  id: LetterTarget,
  results: GenerateResults,
  streaming: Partial<Record<GenerateTarget, string>>,
): { text: string; subject?: string } | null {
  const partial = streaming[id];

  if (id === 'companyEmail') {
    const email = results.companyEmail;
    if (email === undefined && partial === undefined) return null;
    return { text: email?.body ?? partial ?? '', subject: email?.subject };
  }

  const done = results[id];
  if (done === undefined && partial === undefined) return null;
  return { text: done ?? partial ?? '' };
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(current => (current === key ? null : current)), 2000);
  };

  return { copied, copy };
}

interface LetterCardProps {
  title: string;
  text: string;
  subject?: string;
  fileName: string;
  mode: 'text' | 'file';
  isStreaming: boolean;
  copiedKey: string | null;
  onCopy: (key: string, text: string) => void;
}

function LetterCard({
  title,
  text,
  subject,
  fileName,
  mode,
  isStreaming,
  copiedKey,
  onCopy,
}: LetterCardProps) {
  const [expanded, setExpanded] = useState(false);
  const clipboardText = subject ? `Subject: ${subject}\n\n${text}` : text;
  const showBody = mode === 'text' || expanded || isStreaming;

  return (
    <div className="rounded-md border border-border p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground"
            disabled={isStreaming || !text}
            onClick={() => onCopy(fileName, clipboardText)}
          >
            {copiedKey === fileName ? <Check size={13} /> : <Copy size={13} />}
            {copiedKey === fileName ? 'Copied' : 'Copy'}
          </Button>
          <Button
            variant={mode === 'file' ? 'default' : 'ghost'}
            size="sm"
            className="gap-1.5 text-xs"
            disabled={isStreaming || !text}
            onClick={() => downloadBlob(buildTextFile(text, subject), `${fileName}.txt`)}
          >
            <Download size={13} />
            .txt
          </Button>
        </div>
      </div>

      {subject && (
        <p className="mb-2 text-xs text-muted-foreground">
          <span className="text-foreground">Subject:</span> {subject}
        </p>
      )}

      {showBody ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {text}
          {isStreaming && <span className="ml-0.5 animate-pulse text-indigo-400">▍</span>}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-xs text-indigo-400 hover:text-indigo-300"
        >
          Show text
        </button>
      )}
    </div>
  );
}

function ResumeResult({
  resume,
  fileName,
  error,
}: {
  resume: GeneratedResume;
  fileName: string;
  error?: string;
}) {
  const [showLog, setShowLog] = useState(true);

  return (
    <div className="rounded-md border border-green-500/20 bg-green-500/5 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <FileText size={14} className="text-green-500" />
          {resume.header.name} — {resume.sections.length} sections kept
        </p>
        {/* A PDF hiccup degrades to a note instead of destroying the results
            the user just waited for. */}
        <ErrorBoundary fallback={<span className="text-xs text-destructive">PDF unavailable</span>}>
          <Suspense fallback={null}>
            <PDFDownloadLink document={<ResumePdf resume={resume} />} fileName={`${fileName}.pdf`}>
              {({ loading }) => (
                <Button size="sm" className="shrink-0 gap-1.5 text-xs" disabled={loading}>
                  <Download size={13} />
                  {loading ? 'Preparing…' : 'Download PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          </Suspense>
        </ErrorBoundary>
      </div>

      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

      {resume.changeLog.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowLog(v => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {showLog ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            What changed ({resume.changeLog.length})
          </button>
          {showLog && (
            <ul className="mt-2 space-y-1">
              {resume.changeLog.map((entry, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-0.5 shrink-0 text-green-500">•</span>
                  {entry}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {resume.sections.map((section, i) => (
          <Badge key={i} variant="secondary" className="text-[10px]">
            {section.heading}
          </Badge>
        ))}
      </div>
    </div>
  );
}

interface Props {
  result: AnalysisResult;
  resumeText: string;
  jobPosting: string;
  company: string;
  language: string;
}

export function GeneratePanel({ result, resumeText, jobPosting, company, language }: Props) {
  const [selected, setSelected] = useState<Set<GenerateTarget>>(new Set(['resume']));
  const [instructions, setInstructions] = useState('');
  const [hrName, setHrName] = useState('');
  const [letterMode, setLetterMode] = useState<'text' | 'file'>('text');
  const { isLoading, results, streaming, active, error, sectionErrors, start } = useGenerate();
  const { copied, copy } = useCopy();

  const toggle = (id: GenerateTarget) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleGenerate = () =>
    start({
      resumeText,
      jobPosting,
      analysis: result,
      targets: [...selected],
      instructions,
      company,
      hrName,
      language,
    });

  const baseName = slugify(company, 'application');
  const hasResults =
    Boolean(results.resume || results.coverLetter || results.companyEmail || results.hrMessage) ||
    Object.keys(streaming).length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles size={15} className="text-indigo-400" />
          Generate application
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="instructions">What should change in the resume?</Label>
          <Textarea
            id="instructions"
            rows={4}
            placeholder="e.g. Move Kubernetes and Terraform to the top of Skills, emphasise the payments project, add that I mentored two juniors."
            className="resize-none text-sm"
            disabled={isLoading}
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Facts, dates, employers and section order stay as they are — only wording, ordering and
            emphasis change. Anything that cannot be supported by the resume is skipped and listed
            in the change log.
          </p>
        </div>

        <div className="space-y-2">
          {TARGETS.map(target => (
            <label
              key={target.id}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
                selected.has(target.id)
                  ? 'border-indigo-500/40 bg-indigo-500/5'
                  : 'border-border hover:border-border/80',
              )}
            >
              <input
                type="checkbox"
                className="mt-0.5 accent-indigo-500"
                checked={selected.has(target.id)}
                disabled={isLoading}
                onChange={() => toggle(target.id)}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">{target.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{target.hint}</p>
              </div>
            </label>
          ))}
        </div>

        {selected.has('hrMessage') && (
          <div className="space-y-2">
            <Label htmlFor="hrName">Recruiter&apos;s name (optional)</Label>
            <Input
              id="hrName"
              placeholder="e.g. Anna"
              className="text-sm"
              disabled={isLoading}
              value={hrName}
              onChange={e => setHrName(e.target.value)}
            />
          </div>
        )}

        <Button
          className="w-full gap-2 text-xs"
          disabled={selected.size === 0 || isLoading}
          onClick={handleGenerate}
        >
          {isLoading ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              {active ? `Writing ${TARGET_LABELS[active].toLowerCase()}…` : 'Generating…'}
            </>
          ) : (
            <>
              <Sparkles size={13} />
              Generate ({selected.size})
            </>
          )}
        </Button>

        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}

        {hasResults && (
          <div className="space-y-3 border-t border-border pt-4">
            {results.resume && (
              <ResumeResult
                resume={results.resume}
                fileName={`${baseName}-resume`}
                error={sectionErrors.resume}
              />
            )}

            {sectionErrors.resume && !results.resume && (
              <p className="text-xs text-destructive">
                The resume came back malformed: {sectionErrors.resume}
              </p>
            )}

            {LETTER_CARDS.some(card => letterContent(card.id, results, streaming) !== null) && (
              <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                <span className="mr-1">Letters as:</span>
                {(['text', 'file'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setLetterMode(mode)}
                    className={cn(
                      'rounded px-2 py-1 capitalize transition-colors',
                      letterMode === mode
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : 'hover:text-foreground',
                    )}
                  >
                    {mode === 'text' ? 'Plain text' : 'File'}
                  </button>
                ))}
              </div>
            )}

            {LETTER_CARDS.map(card => {
              const content = letterContent(card.id, results, streaming);
              if (content === null) return null;

              return (
                <LetterCard
                  key={card.id}
                  title={TARGET_LABELS[card.id]}
                  text={content.text}
                  subject={content.subject}
                  fileName={`${baseName}-${card.fileSuffix}`}
                  mode={letterMode}
                  isStreaming={active === card.id}
                  copiedKey={copied}
                  onCopy={copy}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
