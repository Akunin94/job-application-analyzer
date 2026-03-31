import { Redis } from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });

  redis.on('error', (err: Error) => {
    console.error('[Redis] connection error:', err.message);
  });

  return redis;
}
