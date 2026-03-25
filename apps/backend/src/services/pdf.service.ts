import { PDFParse } from 'pdf-parse';
import { AppError } from '../middleware/error.middleware.js';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = result.text.trim();

    if (!text) {
      throw new AppError(422, 'PDF appears to be empty or contains no extractable text');
    }

    return text;
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('pdf-parse error:', err);
    throw new AppError(422, 'Failed to parse PDF file');
  }
}
