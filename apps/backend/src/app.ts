import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { aiLimiter, apiLimiter } from './middleware/rate-limit.middleware.js';
import { analyzeRouter } from './routes/analyze.route.js';
import { docsRouter } from './routes/docs.route.js';
import { healthRouter } from './routes/health.route.js';
import { uploadRouter } from './routes/upload.route.js';
import { urlRouter } from './routes/url.route.js';
import { webhookRouter } from './routes/webhook.route.js';

export const app: Express = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '2mb' }));

// Mounted ahead of the limiter on purpose: one Swagger UI page load pulls a
// handful of assets, and reading the docs shouldn't eat the caller's request
// budget for the endpoints the docs describe.
app.use('/api', docsRouter);

app.use('/api', apiLimiter);
app.use('/api/analyze', aiLimiter);
app.use('/api/webhook', aiLimiter);

app.use('/api', healthRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/parse-url', urlRouter);
app.use('/api/webhook', webhookRouter);

app.use(errorMiddleware);
