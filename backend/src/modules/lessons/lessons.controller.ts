import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

import { AppError } from '../../common/errors/AppError';
import type { UserRole } from '../auth/auth.types';

import { lessonsService } from './lessons.service';
import {
    validateUpdateLessonPayload,
} from './lessons.validation';

type AuthenticatedLessonUser = {
    id: string;
    role: UserRole;
};

const LESSON_PDF_MAX_SIZE_BYTES = 10 * 1024 * 1024;

const lessonPdfUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: LESSON_PDF_MAX_SIZE_BYTES,
        files: 1,
    },
    fileFilter: (_request, file, callback) => {
        const isPdfFile =
            file.mimetype === 'application/pdf' ||
            file.originalname.toLowerCase().endsWith('.pdf');

        if (!isPdfFile) {
            callback(
                new AppError(
                    'BAD_REQUEST',
                    400,
                    'PDF: only .pdf files are allowed',
                ),
            );

            return;
        }

        callback(null, true);
    },
}).single('pdf');

export const lessonPdfUploadMiddleware = (
    request: Request,
    response: Response,
    next: NextFunction,
): void => {
    lessonPdfUpload(request, response, (error: unknown) => {
        if (!error) {
            next();
            return;
        }

        if (error instanceof AppError) {
            next(error);
            return;
        }

        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                next(
                    new AppError(
                        'BAD_REQUEST',
                        400,
                        'PDF is too large (max 10MB)',
                    ),
                );
                return;
            }

            next(
                new AppError(
                    'BAD_REQUEST',
                    400,
                    `Upload error: ${error.code}`,
                ),
            );
            return;
        }

        next(new AppError('BAD_REQUEST', 400, 'Invalid file upload'));
    });
};

const requireParamId = (value: unknown, paramName: string): string => {
    if (typeof value !== 'string') {
        throw new AppError('BAD_REQUEST', 400, `${paramName} is required`);
    }

    const normalizedValue = value.trim();

    if (!normalizedValue) {
        throw new AppError('BAD_REQUEST', 400, `${paramName} is required`);
    }

    return normalizedValue;
};

const isUserRole = (value: unknown): value is UserRole =>
    value === 'STUDENT' || value === 'TEACHER' || value === 'ADMIN';

const getAuthenticatedUserOrThrow = (
    request: Request,
): AuthenticatedLessonUser => {
    const user = request.user;

    if (!user || typeof user !== 'object') {
        throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
    }

    const userId =
        'id' in user && typeof user.id === 'string' ? user.id.trim() : '';

    const userRole = 'role' in user ? user.role : undefined;

    if (!userId || !isUserRole(userRole)) {
        throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
    }

    return {
        id: userId,
        role: userRole,
    };
};

export const getLessonByIdHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const lessonId = requireParamId(request.params.id, 'lessonId');
        const lesson = await lessonsService.getLessonById(lessonId);

        response.status(200).json(lesson);
    } catch (error) {
        next(error);
    }
};

export const updateLessonHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const lessonId = requireParamId(request.params.id, 'lessonId');
        const authenticatedUser = getAuthenticatedUserOrThrow(request);
        const payload = validateUpdateLessonPayload(request.body);

        const updatedLesson = await lessonsService.updateLesson(
            lessonId,
            authenticatedUser,
            payload,
            request.file ?? null,
        );

        response.status(200).json(updatedLesson);
    } catch (error) {
        next(error);
    }
};

export const deleteLessonHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const lessonId = requireParamId(request.params.id, 'lessonId');
        const authenticatedUser = getAuthenticatedUserOrThrow(request);

        await lessonsService.deleteLesson(lessonId, authenticatedUser);

        response.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const getLessonPdfHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const lessonId = requireParamId(request.params.id, 'lessonId');
        const authenticatedUser = getAuthenticatedUserOrThrow(request);

        const { stream } = await lessonsService.getLessonPdfStream(
            lessonId,
            authenticatedUser,
        );

        response.setHeader('Content-Type', 'application/pdf');
        response.setHeader('Content-Disposition', 'inline; filename="lesson.pdf"');
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('Pragma', 'no-cache');
        response.setHeader('X-Content-Type-Options', 'nosniff');

        const handleStreamError = (): void => {
            if (response.headersSent) {
                response.destroy();
                stream.destroy();
                return;
            }

            next(new AppError('NOT_FOUND', 404, 'PDF not found'));
        };

        stream.on('error', handleStreamError);

        response.on('close', () => {
            stream.destroy();
        });

        request.on('aborted', () => {
            stream.destroy();
        });

        stream.pipe(response);
    } catch (error) {
        next(error);
    }
};

export const uploadLessonPdfHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const lessonId = requireParamId(request.params.id, 'lessonId');
        const authenticatedUser = getAuthenticatedUserOrThrow(request);

        if (!request.file) {
            throw new AppError('BAD_REQUEST', 400, 'pdf file is required');
        }

        const updatedLesson = await lessonsService.uploadLessonPdf(
            lessonId,
            authenticatedUser,
            request.file,
        );

        response.status(200).json(updatedLesson);
    } catch (error) {
        next(error);
    }
};

export const deleteLessonPdfHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const lessonId = requireParamId(request.params.id, 'lessonId');
        const authenticatedUser = getAuthenticatedUserOrThrow(request);

        await lessonsService.deleteLessonPdf(lessonId, authenticatedUser);

        response.status(204).send();
    } catch (error) {
        next(error);
    }
};
