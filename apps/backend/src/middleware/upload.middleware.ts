import { RequestHandler } from 'express';
import multer from 'multer';
import { AppError } from './error.middleware.js';

const FIVE_MB = 5 * 1024 * 1024;

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new AppError(400, 'Only PDF files are allowed'));
  }
};

export const uploadMiddleware: RequestHandler = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FIVE_MB },
  fileFilter,
}).single('resume');
