import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { AnalysisResult } from '@/app/store';

export function encodeAnalysis(result: AnalysisResult): string {
  return compressToEncodedURIComponent(JSON.stringify(result));
}

export function decodeAnalysis(encoded: string): AnalysisResult | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    return JSON.parse(json) as AnalysisResult;
  } catch {
    return null;
  }
}

export function buildShareUrl(result: AnalysisResult): string {
  const encoded = encodeAnalysis(result);
  const base = window.location.origin;
  return `${base}/share?d=${encoded}`;
}

export function decodeJobPosting(encoded: string): string | null {
  try {
    return decompressFromEncodedURIComponent(encoded) || null;
  } catch {
    return null;
  }
}
