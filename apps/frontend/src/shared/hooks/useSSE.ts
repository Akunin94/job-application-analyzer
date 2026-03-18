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
          throw new Error(`Request failed: ${res.status}`);
        }

        setStatus('streaming');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

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
              onEvent({ type, data });
            } catch {
              // skip malformed event
            }
          }
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
