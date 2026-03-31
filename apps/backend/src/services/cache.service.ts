import { createHash } from 'crypto';
import { getRedis } from '../config/redis.js';
import { type AnalysisResult } from '../schemas/analyze.schema.js';

const TTL_SECONDS = 24 * 60 * 60; // 24 hours

export function cacheKey(resumeText: string, jobPosting: string): string {
  return (
    'analysis:' +
    createHash('sha256')
      .update(resumeText + '\x00' + jobPosting)
      .digest('hex')
  );
}

export async function getCachedAnalysis(key: string): Promise<AnalysisResult | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as AnalysisResult;
  } catch {
    return null;
  }
}

export async function setCachedAnalysis(key: string, result: AnalysisResult): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(key, JSON.stringify(result), 'EX', TTL_SECONDS);
  } catch {
    // cache write failure is non-fatal
  }
}
