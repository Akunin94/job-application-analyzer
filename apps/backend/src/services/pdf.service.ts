import { createRequire } from 'module';
import { AppError } from '../middleware/error.middleware.js';

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>;

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    const text = data.text.trim();

    if (!text) {
      throw new AppError(422, 'PDF appears to be empty or contains no extractable text');
    }

    return text;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(422, 'Failed to parse PDF file');
  }
}
