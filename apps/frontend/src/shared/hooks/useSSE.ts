import { useCallback, useRef, useState } from 'react';
import { StreamingStatus } from '@/app/store';

export interface SSEEvent {
  type: string;
  data: unknown;
}

interface UseSSEReturn {
  status: StreamingStatus;
  connect: (url: string, body: unknown) => Promise<void>;
  abort: () => void;
}

/** Turns a failed response into something worth showing a user, not "Request failed: 429". */
async function describeFailure(res: Response): Promise<string> {
  if (res.status === 429) {
    return 'Rate limit reached — the AI endpoints allow 10 requests per 15 minutes. Wait a moment and try again.';
  }

  const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
  const detail = typeof body?.error === 'string' ? body.error : '';

  return detail || `The server returned ${res.status}. Check that the backend is running.`;
}

export function useSSE(onEvent: (event: SSEEvent) => void): UseSSEReturn {
  const [status, setStatus] = useState<StreamingStatus>('idle');
  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setStatus('idle');
  }, []);

  const connect = useCallback(
    async (url: string, body: unknown) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus('connecting');

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(await describeFailure(res));
        }

        setStatus('streaming');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let sawTerminalEvent = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE messages are separated by double newlines
          const messages = buffer.split('\n\n');
          buffer = messages.pop() ?? '';

          for (const message of messages) {
            const eventMatch = message.match(/^event: (.+)$/m);
            const dataMatch = message.match(/^data: (.+)$/m);
            if (!dataMatch) continue;

            const type = eventMatch?.[1] ?? 'message';
            try {
              const data = JSON.parse(dataMatch[1]) as unknown;
              if (type === 'done' || type === 'error') sawTerminalEvent = true;
              onEvent({ type, data });
            } catch {
              // skip malformed event
            }
          }
        }

        // A stream that ends without `done` or `error` means the server went
        // away mid-response (crash, restart, proxy timeout). Without this the
        // UI just sits there showing nothing, as if the click never happened.
        if (!sawTerminalEvent) {
          setStatus('error');
          onEvent({
            type: 'error',
            data: { message: 'The connection dropped before the response finished. Try again.' },
          });
          return;
        }

        setStatus('done');
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setStatus('error');
        onEvent({
          type: 'error',
          data: { message: err instanceof Error ? err.message : 'SSE failed' },
        });
      }
    },
    [onEvent],
  );

  return { status, connect, abort };
}
