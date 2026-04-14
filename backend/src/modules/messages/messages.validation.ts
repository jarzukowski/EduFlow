import { AppError } from '../../common/errors/AppError';

import type {
    GetInboxQuery,
    SendMessageDto,
    StartAdminConversationDto,
    StartConversationDto,
} from './messages.types';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const requireTrimmedString = (
    value: unknown,
    fieldName: string,
    options: { min: number; max: number },
): string => {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new AppError('BAD_REQUEST', 400, `${fieldName} is required`);
    }

    const trimmedValue = value.trim();

    if (trimmedValue.length < options.min) {
        throw new AppError(
            'BAD_REQUEST',
            400,
            `${fieldName} must have at least ${options.min} characters`,
        );
    }

    if (trimmedValue.length > options.max) {
        throw new AppError(
            'BAD_REQUEST',
            400,
            `${fieldName} must have at most ${options.max} characters`,
        );
    }

    return trimmedValue;
};

const normalizeOptionalTrimmedString = (
    value: unknown,
    fieldName: string,
): string | undefined => {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value !== 'string') {
        throw new AppError('BAD_REQUEST', 400, `${fieldName} must be a string`);
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const normalizeOptionalBoolean = (
    value: unknown,
    fieldName: string,
): boolean | undefined => {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        const normalizedValue = value.trim().toLowerCase();

        if (normalizedValue === 'true') {
            return true;
        }

        if (normalizedValue === 'false') {
            return false;
        }
    }

    throw new AppError('BAD_REQUEST', 400, `${fieldName} must be a boolean`);
};

const normalizeOptionalInteger = (
    value: unknown,
    fieldName: string,
    options: { min: number; max: number },
): number | undefined => {
    if (value === undefined) {
        return undefined;
    }

    const numericValue =
        typeof value === 'number'
            ? value
            : Number(value);

    if (!Number.isFinite(numericValue) || !Number.isInteger(numericValue)) {
        throw new AppError('BAD_REQUEST', 400, `${fieldName} must be an integer`);
    }

    if (numericValue < options.min || numericValue > options.max) {
        throw new AppError(
            'BAD_REQUEST',
            400,
            `${fieldName} must be between ${options.min} and ${options.max}`,
        );
    }

    return numericValue;
};

export const validateGetInboxQuery = (query: unknown): GetInboxQuery => {
    if (!isPlainObject(query)) {
        throw new AppError('BAD_REQUEST', 400, 'Invalid query');
    }

    const limit = normalizeOptionalInteger(query.limit, 'limit', { min: 1, max: 50 }) ?? 20;
    const unreadOnly = normalizeOptionalBoolean(query.unreadOnly, 'unreadOnly') ?? false;
    const cursor = normalizeOptionalTrimmedString(query.cursor, 'cursor') ?? null;

    return {
        limit,
        unreadOnly,
        cursor,
    };
};

export const validateStartConversationDto = (
    body: unknown,
): StartConversationDto => {
    if (!isPlainObject(body)) {
        throw new AppError('BAD_REQUEST', 400, 'Invalid request body');
    }

    const courseId = requireTrimmedString(body.courseId, 'courseId', {
        min: 5,
        max: 64,
    });

    const studentIdRaw = body.studentId;
    const studentId =
        studentIdRaw === undefined
            ? undefined
            : requireTrimmedString(studentIdRaw, 'studentId', {
                min: 5,
                max: 64,
            });

    return {
        courseId,
        studentId,
    };
};

export const validateStartAdminConversationDto = (
    body: unknown,
): StartAdminConversationDto => {
    if (!isPlainObject(body)) {
        throw new AppError('BAD_REQUEST', 400, 'Invalid request body');
    }

    const userId = requireTrimmedString(body.userId, 'userId', {
        min: 5,
        max: 64,
    });

    return {
        userId,
    };
};

export const validateSendMessageDto = (
    requestBody: unknown,
): SendMessageDto => {
    if (!isPlainObject(requestBody)) {
        throw new AppError('BAD_REQUEST', 400, 'Invalid request body');
    }

    const body = requireTrimmedString(requestBody.body, 'body', {
        min: 1,
        max: 2000,
    });

    return {
        body,
    };
};