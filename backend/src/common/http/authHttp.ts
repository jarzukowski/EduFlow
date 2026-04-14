import type { Request } from 'express';

import { AppError } from '../errors/AppError';

export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

export type AuthenticatedUser = {
    id: string;
    role: Role;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isRole = (value: unknown): value is Role => {
    return value === 'STUDENT' || value === 'TEACHER' || value === 'ADMIN';
};

const isAuthenticatedUser = (value: unknown): value is AuthenticatedUser => {
    if (!isPlainObject(value)) {
        return false;
    }

    const userId = value.id;
    const userRole = value.role;

    const hasValidUserId = typeof userId === 'string' && userId.trim().length > 0;
    const hasValidUserRole = isRole(userRole);

    return hasValidUserId && hasValidUserRole;
};

export const requireUserOrThrow = (req: Request): AuthenticatedUser => {
    const authenticatedUser = req.user;

    if (!isAuthenticatedUser(authenticatedUser)) {
        throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
    }

    return authenticatedUser;
};

export const requireAdminOrThrow = (req: Request): AuthenticatedUser => {
    const authenticatedUser = requireUserOrThrow(req);

    if (authenticatedUser.role !== 'ADMIN') {
        throw new AppError('FORBIDDEN', 403, 'Only admin can perform this action');
    }

    return authenticatedUser;
};

export const requireParamId = (value: unknown, paramName: string): string => {
    if (typeof value !== 'string') {
        throw new AppError('BAD_REQUEST', 400, `${paramName} is required`);
    }

    const normalizedValue = value.trim();

    if (!normalizedValue) {
        throw new AppError('BAD_REQUEST', 400, `${paramName} is required`);
    }

    return normalizedValue;
};