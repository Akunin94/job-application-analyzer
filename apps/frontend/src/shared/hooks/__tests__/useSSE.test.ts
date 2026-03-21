import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSSE } from '../useSSE';

const encoder = new TextEncoder();

function makeStream(...chunks: string[]) {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

function mockFetchOk(...sseChunks: string[]) {
  return vi.fn().mockResolvedValue({
    ok: true,
    body: makeStream(...sseChunks),
  });
}

describe('useSSE', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('starts with idle status', () => {
    const { result } = renderHook(() => useSSE(vi.fn()));
    expect(result.current.status).toBe('idle');
  });

  it('transitions through connecting → streaming → done', async () => {
    global.fetch = mockFetchOk('event: done\ndata: null\n\n');
    const onEvent = vi.fn();
    const { result } = renderHook(() => useSSE(onEvent));

    await act(async () => {
      await result.current.connect('http://localhost:3001/api/analyze', {});
    });

    expect(result.current.status).toBe('done');
  });

  it('calls onEvent for each parsed SSE message', async () => {
    global.fetch = mockFetchOk(
      'event: match_score\ndata: {"score":85,"confidence":"high"}\n\n',
      'event: done\ndata: null\n\n',
    );
    const onEvent = vi.fn();
    const { result } = renderHook(() => useSSE(onEvent));

    await act(async () => {
      await result.current.connect('http://localhost:3001/api/analyze', {});
    });

    expect(onEvent).toHaveBeenCalledWith({
      type: 'match_score',
      data: { score: 85, confidence: 'high' },
    });
    expect(onEvent).toHaveBeenCalledWith({ type: 'done', data: null });
  });

  it('skips malformed SSE data without throwing', async () => {
    global.fetch = mockFetchOk('event: bad\ndata: {not json}\n\n', 'event: done\ndata: null\n\n');
    const onEvent = vi.fn();
    const { result } = renderHook(() => useSSE(onEvent));

    await act(async () => {
      await result.current.connect('http://localhost:3001/api/analyze', {});
    });

    expect(result.current.status).toBe('done');
    // only the valid 'done' event should have been called
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith({ type: 'done', data: null });
  });

  it('sets status to error and calls onEvent on fetch failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const onEvent = vi.fn();
    const { result } = renderHook(() => useSSE(onEvent));

    await act(async () => {
      await result.current.connect('http://localhost:3001/api/analyze', {});
    });

    expect(result.current.status).toBe('error');
    expect(onEvent).toHaveBeenCalledWith({
      type: 'error',
      data: { message: 'Network error' },
    });
  });

  it('sets status to error on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, body: null });
    const onEvent = vi.fn();
    const { result } = renderHook(() => useSSE(onEvent));

    await act(async () => {
      await result.current.connect('http://localhost:3001/api/analyze', {});
    });

    expect(result.current.status).toBe('error');
  });

  it('abort() resets status to idle', async () => {
    // Set up a fetch that never resolves (simulates long stream)
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useSSE(vi.fn()));

    // Start connection (don't await — it hangs)
    act(() => {
      void result.current.connect('http://localhost:3001/api/analyze', {});
    });

    await waitFor(() => expect(result.current.status).toBe('connecting'));

    act(() => {
      result.current.abort();
    });

    expect(result.current.status).toBe('idle');
  });
});
