import { AppError } from '../../common/errors/AppError';
import type { UserRole } from '../auth/auth.types';
import type {
    AdminMessageRole,
    AdminMessageRoleMode,
    AdminMessageTarget,
    AdminNotificationTarget,
    AdminUserStatus,
    ChangeUserRolePayload,
    SendAdminMessagePayload,
    SendAdminNotificationPayload,
} from './admin.types';

const USER_ROLES: readonly UserRole[] = ['STUDENT', 'TEACHER', 'ADMIN'];
const USER_STATUSES: readonly AdminUserStatus[] = ['ACTIVE', 'BLOCKED'];
const NOTIFICATION_TARGETS: readonly AdminNotificationTarget[] = ['ALL', 'ROLE', 'USER'];
const MESSAGE_TARGETS: readonly AdminMessageTarget[] = ['ALL', 'ROLE', 'USER'];
const MESSAGE_ROLES: readonly AdminMessageRole[] = ['STUDENT', 'TEACHER'];
const MESSAGE_ROLE_MODES: readonly AdminMessageRoleMode[] = ['ALL', 'USER'];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const ensurePlainObject = (value: unknown): Record<string, unknown> => {
    if (!isPlainObject(value)) {
        throw new AppError('BAD_REQUEST', 400, 'Invalid body');
    }

    return value;
};

const parseNonEmptyString = (value: unknown): string | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
};

const isAllowedEnumValue = <T extends string>(
    value: string,
    allowedValues: readonly T[],
): value is T => allowedValues.some((allowedValue) => allowedValue === value);

const parseRequiredEnum = <T extends string>(
    value: unknown,
    allowedValues: readonly T[],
    fieldName: string,
): T => {
    const parsedValue = parseNonEmptyString(value);

    if (!parsedValue) {
        throw new AppError('VALIDATION_ERROR', 400, `${fieldName} is required`);
    }

    if (!isAllowedEnumValue(parsedValue, allowedValues)) {
        throw new AppError('VALIDATION_ERROR', 400, `Invalid ${fieldName}`);
    }

    return parsedValue;
};

const validateStringLength = (
    value: string,
    minLength: number,
    maxLength: number,
    fieldName: string,
): string => {
    const trimmedValue = value.trim();

    if (trimmedValue.length < minLength) {
        throw new AppError('VALIDATION_ERROR', 400, `${fieldName} is too short`);
    }

    if (trimmedValue.length > maxLength) {
        throw new AppError('VALIDATION_ERROR', 400, `${fieldName} is too long`);
    }

    return trimmedValue;
};

const validateUserIdLike = (value: unknown, fieldName: string): string => {
    const parsedValue = parseNonEmptyString(value);

    if (!parsedValue) {
        throw new AppError('BAD_REQUEST', 400, `Invalid ${fieldName}`);
    }

    if (parsedValue.length < 5 || parsedValue.length > 64) {
        throw new AppError('BAD_REQUEST', 400, `Invalid ${fieldName}`);
    }

    if (/\s/.test(parsedValue)) {
        throw new AppError('BAD_REQUEST', 400, `Invalid ${fieldName}`);
    }

    return parsedValue;
};

const validateInternalHref = (value: unknown): string | undefined => {
    const parsedValue = parseNonEmptyString(value);

    if (!parsedValue) {
        return undefined;
    }

    if (!parsedValue.startsWith('/')) {
        throw new AppError('VALIDATION_ERROR', 400, 'href must start with "/"');
    }

    if (parsedValue.startsWith('//')) {
        throw new AppError('VALIDATION_ERROR', 400, 'href must be an internal path');
    }

    if (parsedValue.length > 200) {
        throw new AppError('VALIDATION_ERROR', 400, 'href is too long');
    }

    return parsedValue;
};

export const validateAdminUserIdParam = (value: unknown): string =>
    validateUserIdLike(value, 'user id');

export const validateChangeUserRoleBody = (body: unknown): ChangeUserRolePayload => {
    const parsedBody = ensurePlainObject(body);
    const role = parseRequiredEnum(parsedBody.role, USER_ROLES, 'role');

    return { role };
};

export const validateSendAdminNotificationBody = (
    body: unknown,
): SendAdminNotificationPayload => {
    const parsedBody = ensurePlainObject(body);

    const target = parseRequiredEnum(parsedBody.target, NOTIFICATION_TARGETS, 'target');

    const rawTitle = parseNonEmptyString(parsedBody.title);
    const rawMessage = parseNonEmptyString(parsedBody.message);

    if (!rawTitle) {
        throw new AppError('VALIDATION_ERROR', 400, 'title is required');
    }

    if (!rawMessage) {
        throw new AppError('VALIDATION_ERROR', 400, 'message is required');
    }

    const title = validateStringLength(rawTitle, 3, 120, 'title');
    const message = validateStringLength(rawMessage, 3, 600, 'message');
    const href = validateInternalHref(parsedBody.href);

    if (target === 'ALL') {
        return { target, title, message, href };
    }

    if (target === 'ROLE') {
        const role = parseRequiredEnum(parsedBody.role, USER_ROLES, 'role');
        return { target, role, title, message, href };
    }

    const userId = validateUserIdLike(parsedBody.userId, 'userId');
    return { target, userId, title, message, href };
};

export const validateSendAdminMessageBody = (
    body: unknown,
): SendAdminMessagePayload => {
    const parsedBody = ensurePlainObject(body);

    const target = parseRequiredEnum(parsedBody.target, MESSAGE_TARGETS, 'target');

    const rawMessageBody = parseNonEmptyString(parsedBody.body);

    if (!rawMessageBody) {
        throw new AppError('VALIDATION_ERROR', 400, 'body is required');
    }

    const messageBody = validateStringLength(rawMessageBody, 1, 2000, 'body');

    if (target === 'ALL') {
        return { target, body: messageBody };
    }

    if (target === 'USER') {
        const userId = validateUserIdLike(parsedBody.userId, 'userId');
        return { target, userId, body: messageBody };
    }

    const role = parseRequiredEnum(parsedBody.role, MESSAGE_ROLES, 'role');
    const rawMode = parseNonEmptyString(parsedBody.mode);
    const mode = rawMode
        ? parseRequiredEnum(rawMode, MESSAGE_ROLE_MODES, 'mode')
        : 'ALL';

    if (mode === 'USER') {
        const userId = validateUserIdLike(parsedBody.userId, 'userId');
        return { target, role, mode, userId, body: messageBody };
    }

    return { target, role, mode: 'ALL', body: messageBody };
};

export const ADMIN_VALIDATION_ENUMS = {
    USER_ROLES,
    USER_STATUSES,
} as const;