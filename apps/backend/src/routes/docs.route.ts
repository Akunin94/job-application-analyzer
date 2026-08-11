import { Request, Response, Router } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { buildOpenApiDocument } from '../docs/openapi.js';

const openApiDocument = buildOpenApiDocument();

export const docsRouter: Router = Router();

// Swagger UI boots from an inline <script> block, which the global helmet CSP
// (script-src 'self') blocks — the page renders empty. Relaxing it only for
// this route leaves the API's own headers untouched.
const swaggerCsp = helmet.contentSecurityPolicy({
  directives: {
    ...helmet.contentSecurityPolicy.getDefaultDirectives(),
    'script-src': ["'self'", "'unsafe-inline'"],
  },
});

docsRouter.get('/docs.json', (_req: Request, res: Response) => {
  res.json(openApiDocument);
});

docsRouter.use(
  '/docs',
  swaggerCsp,
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: 'AI Job Analyzer API',
    swaggerOptions: { defaultModelsExpandDepth: 0 },
  }),
);
