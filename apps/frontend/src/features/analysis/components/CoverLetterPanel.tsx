import { Check, Copy, Loader2, Mail } from 'lucide-react';
import { useCallback, useState } from 'react';
import { AnalysisResult } from '@/app/store';
import { useSSE } from '@/shared/hooks/useSSE';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { COVER_LETTER_URL } from '../api/analyze';
import { StreamingOutput } from './StreamingOutput';

interface CoverLetterPanelProps {
  resumeText: string;
  jobPosting: string;
  analysis: AnalysisResult;
}

export function CoverLetterPanel({ resumeText, jobPosting, analysis }: CoverLetterPanelProps) {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

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
    connect(COVER_LETTER_URL, { resumeText, jobPosting, analysis });
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Mail size={15} className="text-muted-foreground" />
          Cover Letter
        </CardTitle>
        <div className="flex items-center gap-2">
          {isDone && text && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={copyToClipboard}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
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
        </CardContent>
      )}
    </Card>
  );
}
