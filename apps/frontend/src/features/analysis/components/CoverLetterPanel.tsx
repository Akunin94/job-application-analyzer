import { Check, Copy, Download, Edit2, Loader2, Mail, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { AnalysisResult } from '@/app/store';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Textarea } from '@/shared/components/ui/textarea';
import { useSSE } from '@/shared/hooks/useSSE';
import { COVER_LETTER_URL } from '../api/analyze';
import { StreamingOutput } from './StreamingOutput';

interface CoverLetterPanelProps {
  resumeText: string;
  jobPosting: string;
  analysis: AnalysisResult;
  language?: string;
}

async function downloadDocx(text: string) {
  const { Document, Packer, Paragraph, TextRun } = await import('docx');

  const paragraphs = text
    .split('\n\n')
    .filter(Boolean)
    .map(
      p =>
        new Paragraph({
          children: p
            .split('\n')
            .flatMap((line, i, arr) => [
              new TextRun(line),
              ...(i < arr.length - 1 ? [new TextRun({ break: 1 })] : []),
            ]),
          spacing: { after: 160 },
        }),
    );

  const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cover-letter.docx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function CoverLetterPanel({
  resumeText,
  jobPosting,
  analysis,
  language = 'auto',
}: CoverLetterPanelProps) {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleEvent = useCallback((event: { type: string; data: unknown }) => {
    if (event.type === 'cover_letter') {
      setText(prev => prev + (event.data as string));
    }
  }, []);

  const { status, connect } = useSSE(handleEvent);
  const isStreaming = status === 'connecting' || status === 'streaming';
  const isDone = status === 'done';

  const generate = () => {
    setText('');
    setCopied(false);
    setIsEditing(false);
    connect(COVER_LETTER_URL, { resumeText, jobPosting, analysis, language });
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadDocx(text);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Mail size={15} className="text-muted-foreground" />
          Cover Letter
        </CardTitle>

        <div className="flex items-center gap-1.5">
          {isDone && text && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={copyToClipboard}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setIsEditing(e => !e)}
              >
                {isEditing ? <X size={13} /> : <Edit2 size={13} />}
                {isEditing ? 'Done' : 'Edit'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Download size={13} />
                )}
                {isExporting ? 'Exporting…' : '.docx'}
              </Button>
            </>
          )}

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={generate}
            disabled={isStreaming}
          >
            {isStreaming ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Mail size={13} />
                {text ? 'Regenerate' : 'Generate'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {(text || isStreaming) && (
        <CardContent>
          {isEditing && isDone ? (
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              className="min-h-72 resize-y font-mono text-sm leading-relaxed"
              spellCheck
            />
          ) : (
            <ScrollArea className="h-72 rounded-md border border-border p-4">
              <StreamingOutput
                text={text}
                isStreaming={isStreaming}
                className="whitespace-pre-wrap text-sm leading-relaxed text-foreground"
              />
              {!text && isStreaming && (
                <StreamingOutput text="" isStreaming className="text-muted-foreground" />
              )}
            </ScrollArea>
          )}
        </CardContent>
      )}
    </Card>
  );
}
