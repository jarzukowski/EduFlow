import { Router } from 'express';
import { requireRole } from '../../middlewares/requireRole';
import {
    deleteLessonHandler,
    deleteLessonPdfHandler,
    getLessonByIdHandler,
    getLessonPdfHandler,
    lessonPdfUploadMiddleware,
    updateLessonHandler,
    uploadLessonPdfHandler,
} from './lessons.controller';

export const lessonsRouter = Router();

lessonsRouter.get('/:id', getLessonByIdHandler);
lessonsRouter.get('/:id/pdf', getLessonPdfHandler);

lessonsRouter.put(
    '/:id',
    requireRole('TEACHER', 'ADMIN'),
    lessonPdfUploadMiddleware,
    updateLessonHandler,
);

lessonsRouter.delete(
    '/:id',
    requireRole('TEACHER', 'ADMIN'),
    deleteLessonHandler,
);

lessonsRouter.post(
    '/:id/pdf',
    requireRole('TEACHER', 'ADMIN'),
    lessonPdfUploadMiddleware,
    uploadLessonPdfHandler,
);

lessonsRouter.delete(
    '/:id/pdf',
    requireRole('TEACHER', 'ADMIN'),
    deleteLessonPdfHandler,
);
