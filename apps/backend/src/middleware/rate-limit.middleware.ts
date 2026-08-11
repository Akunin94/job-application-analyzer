import rateLimit from 'express-rate-limit';

import { env } from '../config/env.js';

// The whole suite shares one app instance and one IP, so counting test requests
// means the tenth `/api/analyze` test starts failing with 429 — and the failure
// lands on whichever test happens to be last, not on the one that broke.
const skipInTests = (): boolean => env.NODE_ENV === 'test';

/** General API: 120 req / 15 min per IP */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { error: 'Too many requests, please try again later.' },
});

/** AI endpoints (Claude calls): 10 req / 15 min per IP */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { error: 'AI request limit reached. Please wait before sending more requests.' },
});
