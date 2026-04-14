import type { ErrorRequestHandler } from 'express';

import { AppError } from '../common/errors/AppError';
import { config } from '../config/env';

export const errorHandler: ErrorRequestHandler = (
    error,
    _req,
    res,
    _next,
) => {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            code: error.code,
            message: error.message,
        });
        return;
    }

    if (error instanceof SyntaxError) {
        res.status(400).json({
            code: 'BAD_REQUEST',
            message: 'Invalid JSON body',
        });
        return;
    }

    res.status(500).json({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unexpected error occurred',
        ...(config.isDev && error instanceof Error ? { stack: error.stack } : {}),
    });
};