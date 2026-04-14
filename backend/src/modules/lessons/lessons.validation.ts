import { AppError } from '../../common/errors/AppError';

import type {
    CreateLessonPayload,
    UpdateLessonPayload,
} from './lessons.types';

const LESSON_TITLE_MIN_LENGTH = 3;
const LESSON_TITLE_MAX_LENGTH = 90;
const LESSON_CONTENT_MIN_LENGTH = 3;
const LESSON_CONTENT_MAX_LENGTH = 1_000;
const ORDER_INDEX_MIN = 1;
const ORDER_INDEX_MAX = 100_000;
const DURATION_MINUTES_MIN = 0;
const DURATION_MINUTES_MAX = 1_000_000;

const CREATE_LESSON_ALLOWED_FIELDS = new Set([
    'title',
    'content',
    'orderIndex',
    'durationMinutes',
    'videoUrl',
]);

const UPDATE_LESSON_ALLOWED_FIELDS = new Set([
    'title',
    'content',
    'orderIndex',
    'durationMinutes',
    'videoUrl',
]);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const ensurePlainObject = (value: unknown): Record<string, unknown> => {
    if (!isPlainObject(value)) {
        throw new AppError('BAD_REQUEST', 400, 'Invalid request body');
    }

    return value;
};

const ensureNoUnexpectedFields = (
    body: Record<string, unknown>,
    allowedFields: Set<string>,
): void => {
    const unexpectedFields = Object.keys(body).filter(
        (fieldName) => !allowedFields.has(fieldName),
    );

    if (unexpectedFields.length > 0) {
        throw new AppError(
            'BAD_REQUEST',
            400,
            `Unexpected fields: ${unexpectedFields.join(', ')}`,
        );
    }
};

const requireTrimmedString = (
    value: unknown,
    fieldName: string,
    options: {
        min: number;
        max: number;
    },
): string => {
    if (typeof value !== 'string') {
        throw new AppError('BAD_REQUEST', 400, `${fieldName} is required`);
    }

    const normalizedValue = value.trim();

    if (!normalizedValue) {
        throw new AppError('BAD_REQUEST', 400, `${fieldName} is required`);
    }

    if (normalizedValue.length < options.min) {
        throw new AppError(
            'BAD_REQUEST',
            400,
            `${fieldName} must have at least ${options.min} characters`,
        );
    }

    if (normalizedValue.length > options.max) {
        throw new AppError(
            'BAD_REQUEST',
            400,
            `${fieldName} must have at most ${options.max} characters`,
        );
    }

    return normalizedValue;
};

const normalizeOptionalRequiredString = (
    value: unknown,
    fieldName: string,
    options: {
        min: number;
        max: number;
    },
): string | undefined => {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        throw new AppError('BAD_REQUEST', 400, `${fieldName} cannot be null`);
    }

    return requireTrimmedString(value, fieldName, options);
};

const normalizeOptionalStringOrNull = (
    value: unknown,
    fieldName: string,
): string | null | undefined => {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    if (typeof value !== 'string') {
        throw new AppError(
            'BAD_REQUEST',
            400,
            `${fieldName} must be a string or null`,
        );
    }

    const normalizedValue = value.trim();

    if (!normalizedValue) {
        return null;
    }

    return normalizedValue;
};

const assertHttpUrlOrNullOrUndefined = (
    value: string | null | undefined,
    fieldName: string,
): void => {
    if (value === undefined || value === null) {
        return;
    }

    try {
        const parsedUrl = new URL(value);
        const isHttpProtocol =
            parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';

        if (!isHttpProtocol) {
            throw new Error('Invalid URL protocol');
        }
    } catch {
        throw new AppError(
            'BAD_REQUEST',
            400,
            `${fieldName} must be a valid http/https URL`,
        );
    }
};

const normalizeOptionalPositiveInteger = (
    value: unknown,
    fieldName: string,
): number | undefined => {
    if (value === undefined) {
        return undefined;
    }

    const normalizedValue =
        typeof value === 'number' ? value : Number(value);

    if (!Number.isFinite(normalizedValue) || !Number.isInteger(normalizedValue)) {
        throw new AppError(
            'BAD_REQUEST',
            400,
            `${fieldName} must be an integer`,
        );
    }

    if (
        normalizedValue < ORDER_INDEX_MIN ||
        normalizedValue > ORDER_INDEX_MAX
    ) {
        throw new AppError(
            'BAD_REQUEST',
            400,
            `${fieldName} must be an integer between ${ORDER_INDEX_MIN} and ${ORDER_INDEX_MAX}`,
        );
    }

    return normalizedValue;
};

const normalizeOptionalDurationMinutes = (
    value: unknown,
): number | null | undefined => {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    if (typeof value === 'string' && value.trim() === '') {
        return null;
    }

    const normalizedValue =
        typeof value === 'number' ? value : Number(value);

    if (!Number.isFinite(normalizedValue) || !Number.isInteger(normalizedValue)) {
        throw new AppError(
            'BAD_REQUEST',
            400,
            'durationMinutes must be an integer or null',
        );
    }

    if (
        normalizedValue < DURATION_MINUTES_MIN ||
        normalizedValue > DURATION_MINUTES_MAX
    ) {
        throw new AppError(
            'BAD_REQUEST',
            400,
            `durationMinutes must be between ${DURATION_MINUTES_MIN} and ${DURATION_MINUTES_MAX}`,
        );
    }

    return normalizedValue;
};

export const validateCreateLessonPayload = (
    rawBody: unknown,
): CreateLessonPayload => {
    const body = ensurePlainObject(rawBody);

    ensureNoUnexpectedFields(body, CREATE_LESSON_ALLOWED_FIELDS);

    const title = requireTrimmedString(body.title, 'title', {
        min: LESSON_TITLE_MIN_LENGTH,
        max: LESSON_TITLE_MAX_LENGTH,
    });

    const content = requireTrimmedString(body.content, 'content', {
        min: LESSON_CONTENT_MIN_LENGTH,
        max: LESSON_CONTENT_MAX_LENGTH,
    });

    const orderIndex = normalizeOptionalPositiveInteger(
        body.orderIndex,
        'orderIndex',
    );

    const videoUrl = normalizeOptionalStringOrNull(body.videoUrl, 'videoUrl');
    assertHttpUrlOrNullOrUndefined(videoUrl, 'videoUrl');

    const durationMinutes = normalizeOptionalDurationMinutes(
        body.durationMinutes,
    );

    return {
        title,
        content,
        orderIndex,
        videoUrl,
        durationMinutes,
    };
};

export const validateUpdateLessonPayload = (
    rawBody: unknown,
): UpdateLessonPayload => {
    const body = ensurePlainObject(rawBody);

    ensureNoUnexpectedFields(body, UPDATE_LESSON_ALLOWED_FIELDS);

    const payload: UpdateLessonPayload = {};

    const title = normalizeOptionalRequiredString(body.title, 'title', {
        min: LESSON_TITLE_MIN_LENGTH,
        max: LESSON_TITLE_MAX_LENGTH,
    });

    if (title !== undefined) {
        payload.title = title;
    }

    const content = normalizeOptionalRequiredString(body.content, 'content', {
        min: LESSON_CONTENT_MIN_LENGTH,
        max: LESSON_CONTENT_MAX_LENGTH,
    });

    if (content !== undefined) {
        payload.content = content;
    }

    if (body.orderIndex !== undefined) {
        payload.orderIndex = normalizeOptionalPositiveInteger(
            body.orderIndex,
            'orderIndex',
        );
    }

    if (body.videoUrl !== undefined) {
        const videoUrl = normalizeOptionalStringOrNull(
            body.videoUrl,
            'videoUrl',
        );

        assertHttpUrlOrNullOrUndefined(videoUrl, 'videoUrl');
        payload.videoUrl = videoUrl;
    }

    if (body.durationMinutes !== undefined) {
        payload.durationMinutes = normalizeOptionalDurationMinutes(
            body.durationMinutes,
        );
    }

    if (Object.keys(payload).length === 0) {
        throw new AppError('BAD_REQUEST', 400, 'No fields to update');
    }

    return payload;
};