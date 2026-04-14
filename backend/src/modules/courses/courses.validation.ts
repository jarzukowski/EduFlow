import { AppError } from '../../common/errors/AppError';

import {
    COURSE_DESCRIPTION_MAX_LENGTH,
    COURSE_DESCRIPTION_MIN_LENGTH,
    COURSE_THUMBNAIL_KEY_SET,
    COURSE_TITLE_MAX_LENGTH,
    COURSE_TITLE_MIN_LENGTH,
} from './courses.constants';

import type {
    CourseThumbnailKey,
    CreateCourseDto,
    UpdateCourseDto,
} from './courses.types';

const ALLOWED_FIELDS = new Set(['title', 'description', 'thumbnailKey']);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const ensurePlainObject = (value: unknown): Record<string, unknown> => {
    if (!isPlainObject(value)) {
        throw new AppError('VALIDATION_ERROR', 400, 'Invalid request body');
    }

    return value;
};

const ensureNoUnexpectedFields = (body: Record<string, unknown>): void => {
    const receivedKeys = Object.keys(body);

    for (const receivedKey of receivedKeys) {
        if (!ALLOWED_FIELDS.has(receivedKey)) {
            throw new AppError('VALIDATION_ERROR', 400, `Unexpected field: ${receivedKey}`);
        }
    }
};

const normalizeRequiredTitle = (value: unknown): string => {
    if (typeof value !== 'string') {
        throw new AppError('VALIDATION_ERROR', 400, 'title must be a string');
    }

    const normalizedTitle = value.trim();

    if (normalizedTitle.length < COURSE_TITLE_MIN_LENGTH) {
        throw new AppError(
            'VALIDATION_ERROR',
            400,
            `Title must have at least ${COURSE_TITLE_MIN_LENGTH} characters`,
        );
    }

    if (normalizedTitle.length > COURSE_TITLE_MAX_LENGTH) {
        throw new AppError(
            'VALIDATION_ERROR',
            400,
            `Title cannot exceed ${COURSE_TITLE_MAX_LENGTH} characters`,
        );
    }

    return normalizedTitle;
};

const normalizeOptionalTitle = (value: unknown): string | undefined => {
    if (value === undefined) {
        return undefined;
    }

    return normalizeRequiredTitle(value);
};

const normalizeRequiredDescription = (value: unknown): string => {
    if (typeof value !== 'string') {
        throw new AppError('VALIDATION_ERROR', 400, 'description must be a string');
    }

    const normalizedDescription = value.trim();

    if (normalizedDescription.length < COURSE_DESCRIPTION_MIN_LENGTH) {
        throw new AppError(
            'VALIDATION_ERROR',
            400,
            `Description must have at least ${COURSE_DESCRIPTION_MIN_LENGTH} characters`,
        );
    }

    if (normalizedDescription.length > COURSE_DESCRIPTION_MAX_LENGTH) {
        throw new AppError(
            'VALIDATION_ERROR',
            400,
            `Description cannot exceed ${COURSE_DESCRIPTION_MAX_LENGTH} characters`,
        );
    }

    return normalizedDescription;
};

const normalizeOptionalDescription = (value: unknown): string | undefined => {
    if (value === undefined) {
        return undefined;
    }

    return normalizeRequiredDescription(value);
};

const normalizeThumbnailKey = (
    value: unknown,
): CourseThumbnailKey | null | undefined => {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    if (typeof value !== 'string') {
        throw new AppError('VALIDATION_ERROR', 400, 'thumbnailKey must be a string');
    }

    const normalizedThumbnailKey = value.trim().toLowerCase();

    if (!normalizedThumbnailKey.length) {
        return null;
    }

    if (!COURSE_THUMBNAIL_KEY_SET.has(normalizedThumbnailKey)) {
        throw new AppError('VALIDATION_ERROR', 400, 'thumbnailKey is invalid');
    }

    return normalizedThumbnailKey as CourseThumbnailKey;
};

export const validateCreateCourse = (body: unknown): CreateCourseDto => {
    const normalizedBody = ensurePlainObject(body);
    ensureNoUnexpectedFields(normalizedBody);

    const title = normalizeRequiredTitle(normalizedBody.title);
    const description = normalizeRequiredDescription(normalizedBody.description);
    const thumbnailKey = normalizeThumbnailKey(normalizedBody.thumbnailKey);

    return {
        title,
        description,
        ...(thumbnailKey !== undefined ? { thumbnailKey } : {}),
    };
};

export const validateUpdateCourse = (body: unknown): UpdateCourseDto => {
    const normalizedBody = ensurePlainObject(body);
    ensureNoUnexpectedFields(normalizedBody);

    const title = normalizeOptionalTitle(normalizedBody.title);
    const description = normalizeOptionalDescription(normalizedBody.description);
    const thumbnailKey = normalizeThumbnailKey(normalizedBody.thumbnailKey);

    if (
        title === undefined &&
        description === undefined &&
        thumbnailKey === undefined
    ) {
        throw new AppError('VALIDATION_ERROR', 400, 'No fields to update');
    }

    return {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(thumbnailKey !== undefined ? { thumbnailKey } : {}),
    };
};