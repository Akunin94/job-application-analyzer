import { Check, Copy, Edit2, Loader2, Send, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { AnalysisResult } from '@/app/store';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Textarea } from '@/shared/components/ui/textarea';
import { useSSE } from '@/shared/hooks/useSSE';
import { FOLLOW_UP_URL } from '../api/analyze';
import { StreamingOutput } from './StreamingOutput';

interface FollowUpEmailPanelProps {
  resumeText: string;
  jobPosting: string;
  analysis: AnalysisResult;
  language?: string;
}

export function FollowUpEmailPanel({
  resumeText,
  jobPosting,
  analysis,
  language = 'auto',
}: FollowUpEmailPanelProps) {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [interviewerName, setInterviewerName] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [keyPoints, setKeyPoints] = useState('');

  const handleEvent = useCallback((event: { type: string; data: unknown }) => {
    if (event.type === 'follow_up') {
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
    connect(FOLLOW_UP_URL, {
      resumeText,
      jobPosting,
      analysis,
      interviewerName,
      interviewDate,
      keyPoints,
      language,
    });
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
          <Send size={15} className="text-muted-foreground" />
          Follow-Up Email
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
                <Send size={13} />
                {text ? 'Regenerate' : 'Generate'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Interviewer name</Label>
            <Input
              placeholder="e.g. Sarah Chen"
              value={interviewerName}
              onChange={e => setInterviewerName(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Interview date</Label>
            <Input
              placeholder="e.g. Monday, March 24"
              value={interviewDate}
              onChange={e => setInterviewDate(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Key discussion points <span className="text-muted-foreground/50">(optional)</span>
          </Label>
          <Textarea
            placeholder="e.g. system design approach, React performance, team culture…"
            value={keyPoints}
            onChange={e => setKeyPoints(e.target.value)}
            className="min-h-16 resize-none text-sm"
          />
        </div>

        {(text || isStreaming) &&
          (isEditing && isDone ? (
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              className="min-h-64 resize-y font-mono text-sm leading-relaxed"
              spellCheck
            />
          ) : (
            <ScrollArea className="h-64 rounded-md border border-border p-4">
              <StreamingOutput
                text={text}
                isStreaming={isStreaming}
                className="whitespace-pre-wrap text-sm leading-relaxed text-foreground"
              />
            </ScrollArea>
          ))}
      </CardContent>
    </Card>
  );
}
