import { describe, expect, it } from 'vitest';
import { AppError } from '../../middleware/error.middleware.js';
import { extractTextFromPdf } from '../pdf.service.js';

describe('extractTextFromPdf', () => {
  it('throws AppError(422) when buffer is not a valid PDF', async () => {
    const buffer = Buffer.from('this is not a pdf');
    await expect(extractTextFromPdf(buffer)).rejects.toMatchObject({
      statusCode: 422,
    });
  });

  it('throws an instance of AppError for invalid input', async () => {
    const buffer = Buffer.from('invalid');
    await expect(extractTextFromPdf(buffer)).rejects.toBeInstanceOf(AppError);
  });

  it('throws AppError(422) for empty buffer', async () => {
    const buffer = Buffer.alloc(0);
    await expect(extractTextFromPdf(buffer)).rejects.toMatchObject({
      statusCode: 422,
    });
  });
});
