import { Router } from 'express';
import { uploadMiddleware } from '../middleware/upload.middleware.js';
import { uploadResume } from '../controllers/upload.controller.js';

export const uploadRouter: Router = Router();

uploadRouter.post('/resume', uploadMiddleware, uploadResume);
