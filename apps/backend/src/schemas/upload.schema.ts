import { z } from 'zod';

export const uploadResponseSchema = z.object({
  text: z.string().min(1),
  fileName: z.string().min(1),
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;
