import { CheckCircle2, ExternalLink, Loader2, Upload } from 'lucide-react';
import { useState } from 'react';
import { useStore, type WebhookConfig } from '@/app/store';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { cn } from '@/shared/lib/cn';
import type { AnalysisResult } from '@/app/store';

const API_URL = import.meta.env.VITE_API_URL as string;

interface WebhookExportButtonProps {
  analysis: AnalysisResult;
  company: string;
}

type SendState = 'idle' | 'sending' | 'success' | 'error';

async function sendToNotion(
  config: WebhookConfig['notion'],
  analysis: AnalysisResult,
  company: string,
): Promise<{ url: string }> {
  const res = await fetch(`${API_URL}/api/webhook/notion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...config, analysis, metadata: { company } }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<{ url: string }>;
}

async function sendToAirtable(
  config: WebhookConfig['airtable'],
  analysis: AnalysisResult,
  company: string,
): Promise<{ id: string }> {
  const res = await fetch(`${API_URL}/api/webhook/airtable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...config, analysis, metadata: { company } }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<{ id: string }>;
}

export function WebhookExportButton({ analysis, company }: WebhookExportButtonProps) {
  const { webhookConfig, setWebhookConfig } = useStore(s => ({
    webhookConfig: s.webhookConfig,
    setWebhookConfig: s.setWebhookConfig,
  }));

  const [open, setOpen] = useState(false);
  const [notionState, setNotionState] = useState<SendState>('idle');
  const [airtableState, setAirtableState] = useState<SendState>('idle');
  const [notionError, setNotionError] = useState('');
  const [airtableError, setAirtableError] = useState('');
  const [notionUrl, setNotionUrl] = useState('');
  const [tab, setTab] = useState<'notion' | 'airtable'>('notion');

  const handleNotionSend = async () => {
    setNotionError('');
    setNotionState('sending');
    try {
      const result = await sendToNotion(webhookConfig.notion, analysis, company);
      setNotionUrl(result.url);
      setNotionState('success');
    } catch (err) {
      setNotionError(err instanceof Error ? err.message : 'Failed to send to Notion');
      setNotionState('error');
    }
  };

  const handleAirtableSend = async () => {
    setAirtableError('');
    setAirtableState('sending');
    try {
      await sendToAirtable(webhookConfig.airtable, analysis, company);
      setAirtableState('success');
    } catch (err) {
      setAirtableError(err instanceof Error ? err.message : 'Failed to send to Airtable');
      setAirtableState('error');
    }
  };

  const notionFilled =
    webhookConfig.notion.integrationToken.trim() && webhookConfig.notion.databaseId.trim();
  const airtableFilled =
    webhookConfig.airtable.apiKey.trim() &&
    webhookConfig.airtable.baseId.trim() &&
    webhookConfig.airtable.tableName.trim();

  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        setOpen(o);
        if (!o) {
          setNotionState('idle');
          setAirtableState('idle');
          setNotionError('');
          setAirtableError('');
          setNotionUrl('');
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
          <Upload size={13} />
          Export
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Export to tracker</DialogTitle>
          <DialogDescription className="text-xs">
            Save this analysis to your job tracking workspace.
          </DialogDescription>
        </DialogHeader>

        <div>
          {/* Tab switcher */}
          <div className="flex rounded-md border border-border bg-muted p-0.5">
            {(['notion', 'airtable'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 rounded py-1 text-xs font-medium transition-colors',
                  tab === t
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t === 'notion' ? 'Notion' : 'Airtable'}
              </button>
            ))}
          </div>

          {/* ── Notion tab ── */}
          {tab === 'notion' && (
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Integration Token</Label>
                <Input
                  className="h-8 font-mono text-xs"
                  placeholder="secret_…"
                  type="password"
                  value={webhookConfig.notion.integrationToken}
                  onChange={e =>
                    setWebhookConfig({
                      notion: { ...webhookConfig.notion, integrationToken: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Database ID</Label>
                <Input
                  className="h-8 font-mono text-xs"
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={webhookConfig.notion.databaseId}
                  onChange={e =>
                    setWebhookConfig({
                      notion: { ...webhookConfig.notion, databaseId: e.target.value },
                    })
                  }
                />
              </div>

              <p className="text-[11px] text-muted-foreground">
                Share your Notion database with the integration, then paste the database ID from its
                URL.
              </p>

              {notionState === 'success' ? (
                <div className="flex items-center gap-2 rounded-md border border-green-500/20 bg-green-500/5 px-3 py-2 text-xs text-green-500">
                  <CheckCircle2 size={13} />
                  Page created!
                  {notionUrl && (
                    <a
                      href={notionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto flex items-center gap-1 underline underline-offset-2"
                    >
                      Open <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              ) : (
                <>
                  {notionError && <p className="text-xs text-destructive">{notionError}</p>}
                  <Button
                    size="sm"
                    className="w-full text-xs"
                    disabled={!notionFilled || notionState === 'sending'}
                    onClick={handleNotionSend}
                  >
                    {notionState === 'sending' ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      'Send to Notion'
                    )}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* ── Airtable tab ── */}
          {tab === 'airtable' && (
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Personal Access Token</Label>
                <Input
                  className="h-8 font-mono text-xs"
                  placeholder="pat…"
                  type="password"
                  value={webhookConfig.airtable.apiKey}
                  onChange={e =>
                    setWebhookConfig({
                      airtable: { ...webhookConfig.airtable, apiKey: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Base ID</Label>
                <Input
                  className="h-8 font-mono text-xs"
                  placeholder="appXXXXXXXXXXXXXX"
                  value={webhookConfig.airtable.baseId}
                  onChange={e =>
                    setWebhookConfig({
                      airtable: { ...webhookConfig.airtable, baseId: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Table Name</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Job Applications"
                  value={webhookConfig.airtable.tableName}
                  onChange={e =>
                    setWebhookConfig({
                      airtable: { ...webhookConfig.airtable, tableName: e.target.value },
                    })
                  }
                />
              </div>

              <p className="text-[11px] text-muted-foreground">
                Expected columns: Company, Match Score, Date, Status, Summary, Skill Gaps,
                Recommendations.
              </p>

              {airtableState === 'success' ? (
                <div className="flex items-center gap-2 rounded-md border border-green-500/20 bg-green-500/5 px-3 py-2 text-xs text-green-500">
                  <CheckCircle2 size={13} />
                  Record created successfully!
                </div>
              ) : (
                <>
                  {airtableError && <p className="text-xs text-destructive">{airtableError}</p>}
                  <Button
                    size="sm"
                    className="w-full text-xs"
                    disabled={!airtableFilled || airtableState === 'sending'}
                    onClick={handleAirtableSend}
                  >
                    {airtableState === 'sending' ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      'Send to Airtable'
                    )}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
