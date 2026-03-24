import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { analyzeRouter } from './routes/analyze.route.js';
import { healthRouter } from './routes/health.route.js';
import { uploadRouter } from './routes/upload.route.js';
import { urlRouter } from './routes/url.route.js';

export const app: Express = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

app.use('/api', healthRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/parse-url', urlRouter);

app.use(errorMiddleware);
