import { AppError } from '../../common/errors/AppError';
import type { UpdateLessonCompletionRequestDTO } from './student.types';

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const requireNonEmptyStringParam = (raw: unknown, paramName: string): string => {
    if (typeof raw !== 'string') {
        throw new AppError('BAD_REQUEST', 400, `${paramName} must be a string`);
    }

    const normalizedValue = raw.trim();

    if (!normalizedValue) {
        throw new AppError('BAD_REQUEST', 400, `${paramName} is required`);
    }

    return normalizedValue;
};

export const validateUpdateLessonCompletionBody = (
    rawBody: unknown,
): UpdateLessonCompletionRequestDTO => {
    if (!isPlainObject(rawBody)) {
        throw new AppError('BAD_REQUEST', 400, 'Invalid request body');
    }

    const completed = rawBody.completed;

    if (typeof completed !== 'boolean') {
        throw new AppError('BAD_REQUEST', 400, 'completed must be a boolean');
    }

    return { completed };
};