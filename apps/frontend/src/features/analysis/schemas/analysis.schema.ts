import { z } from 'zod';

export const analysisFormSchema = z.object({
  jobPosting: z
    .string()
    .min(50, 'Paste the full job posting (at least 50 characters)')
    .max(20_000, 'Job posting is too long'),
});

export type AnalysisFormValues = z.infer<typeof analysisFormSchema>;
