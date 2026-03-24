import { z } from 'zod';

export const parseUrlRequestSchema = z.object({
  url: z
    .string()
    .url('Must be a valid URL')
    .refine(
      url => /linkedin\.com\/jobs\/(view|search)\//i.test(url),
      'Only LinkedIn job URLs are supported (linkedin.com/jobs/view/...)',
    ),
});

export type ParseUrlRequest = z.infer<typeof parseUrlRequestSchema>;
