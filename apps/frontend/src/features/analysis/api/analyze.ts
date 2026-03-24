const API_URL = import.meta.env.VITE_API_URL as string;

export const ANALYZE_URL = `${API_URL}/api/analyze`;
export const COVER_LETTER_URL = `${API_URL}/api/analyze/cover-letter`;
export const FOLLOW_UP_URL = `${API_URL}/api/analyze/follow-up`;
export const PARSE_URL_URL = `${API_URL}/api/parse-url`;

export interface ParsedJobPosting {
  title: string;
  company: string;
  jobPosting: string;
}

export async function fetchJobFromUrl(url: string): Promise<ParsedJobPosting> {
  const res = await fetch(PARSE_URL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<ParsedJobPosting>;
}
