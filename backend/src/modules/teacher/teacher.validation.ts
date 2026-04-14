import { AppError } from '../../common/errors/AppError';

import type { EnrollStudentRequestDTO } from './teacher.types';

const DEFAULT_ENROLLMENTS_PAGE = 1;
const DEFAULT_ENROLLMENTS_LIMIT = 20;
const MAX_ENROLLMENTS_LIMIT = 50;
const MAX_PAGE_VALUE = 10_000;
const MIN_SUGGEST_QUERY_LENGTH = 4;
const MAX_SUGGEST_QUERY_LENGTH = 80;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const parsePositiveInteger = (
    rawValue: unknown,
    fieldName: string,
    {
        defaultValue,
        min,
        max,
    }: {
        defaultValue: number;
        min: number;
        max: number;
    },
): number => {
    if (rawValue === undefined) {
        return defaultValue;
    }

    if (typeof rawValue !== 'string' && typeof rawValue !== 'number') {
        throw new AppError(
            'BAD_REQUEST',
            400,
            `${fieldName} must be an integer between ${min} and ${max}`,
        );
    }

    const parsedValue = Number(rawValue);

    if (
        !Number.isInteger(parsedValue) ||
        parsedValue < min ||
        parsedValue > max
    ) {
        throw new AppError(
            'BAD_REQUEST',
            400,
            `${fieldName} must be an integer between ${min} and ${max}`,
        );
    }

    return parsedValue;
};

export const requireNonEmptyStringParam = (
    rawValue: unknown,
    paramName: string,
): string => {
    if (typeof rawValue !== 'string') {
        throw new AppError('BAD_REQUEST', 400, `${paramName} is required`);
    }

    const normalizedValue = rawValue.trim();

    if (!normalizedValue) {
        throw new AppError('BAD_REQUEST', 400, `${paramName} is required`);
    }

    return normalizedValue;
};

export const validateSuggestQuery = (rawValue: unknown): string => {
    if (typeof rawValue !== 'string') {
        throw new AppError('BAD_REQUEST', 400, 'query is required');
    }

    const normalizedQuery = rawValue.trim();

    if (normalizedQuery.length < MIN_SUGGEST_QUERY_LENGTH) {
        throw new AppError(
            'BAD_REQUEST',
            400,
            `query must have at least ${MIN_SUGGEST_QUERY_LENGTH} characters`,
        );
    }

    if (normalizedQuery.length > MAX_SUGGEST_QUERY_LENGTH) {
        throw new AppError('BAD_REQUEST', 400, 'query is too long');
    }

    return normalizedQuery;
};

export const validateEnrollmentsPagination = (
    rawQuery: unknown,
): { page: number; limit: number } => {
    const queryObject = isPlainObject(rawQuery) ? rawQuery : {};

    const page = parsePositiveInteger(queryObject.page, 'page', {
        defaultValue: DEFAULT_ENROLLMENTS_PAGE,
        min: 1,
        max: MAX_PAGE_VALUE,
    });

    const limit = parsePositiveInteger(queryObject.limit, 'limit', {
        defaultValue: DEFAULT_ENROLLMENTS_LIMIT,
        min: 1,
        max: MAX_ENROLLMENTS_LIMIT,
    });

    return { page, limit };
};

export const validateEnrollStudentBody = (
    rawBody: unknown,
): EnrollStudentRequestDTO => {
    if (!isPlainObject(rawBody)) {
        throw new AppError('BAD_REQUEST', 400, 'Invalid request body');
    }

    const studentId = requireNonEmptyStringParam(
        rawBody.studentId,
        'studentId',
    );

    return { studentId };
};