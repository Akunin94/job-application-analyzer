import { Request, Response, NextFunction } from 'express';
import { extractTextFromPdf } from '../services/pdf.service.js';
import { AppError } from '../middleware/error.middleware.js';
import { UploadResponse } from '../schemas/upload.schema.js';

export async function uploadResume(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError(400, 'No file uploaded');
    }

    const text = await extractTextFromPdf(req.file.buffer);

    const response: UploadResponse = {
      text,
      fileName: req.file.originalname,
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
}
