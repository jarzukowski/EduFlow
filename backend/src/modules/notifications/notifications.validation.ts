import { AppError } from '../../common/errors/AppError';

import type { ListNotificationsQuery } from './notifications.types';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

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

export const validateListNotificationsQuery = (
    query: unknown,
): ListNotificationsQuery => {
    if (!isPlainObject(query)) {
        throw new AppError('BAD_REQUEST', 400, 'Invalid query');
    }

    const unreadOnly = normalizeOptionalBoolean(query.unreadOnly, 'unreadOnly') ?? false;
    const limit = normalizeOptionalInteger(query.limit, 'limit', { min: 1, max: 50 }) ?? 20;
    const cursor = normalizeOptionalTrimmedString(query.cursor, 'cursor') ?? null;

    return {
        unreadOnly,
        limit,
        cursor,
    };
};