import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../common/errors/AppError';
import { parseDateRange } from '../../common/http/parseDateRange';
import { parseEnumOptional } from '../../common/http/parseEnum';
import { parsePagination } from '../../common/http/parsePagination';
import { parseSearch } from '../../common/http/parseSearch';

import { adminService } from './admin.service';
import {
    ADMIN_VALIDATION_ENUMS,
    validateAdminUserIdParam,
    validateChangeUserRoleBody,
    validateSendAdminMessageBody,
    validateSendAdminNotificationBody,
} from './admin.validation';

const { USER_ROLES, USER_STATUSES } = ADMIN_VALIDATION_ENUMS;

const getAuthenticatedAdmin = (req: Request) => {
    if (!req.user) {
        throw new AppError('UNAUTHORIZED', 401, 'Not authenticated');
    }

    if (req.user.role !== 'ADMIN') {
        throw new AppError('FORBIDDEN', 403, 'Forbidden');
    }

    return req.user;
};

const parseAdminUserIdParam = (req: Request): string => {
    return validateAdminUserIdParam(req.params.id);
};

export const getAdminHealthHandler = (
    _req: Request,
    res: Response,
): void => {
    res.status(200).json({
        ok: true,
        module: 'admin',
        timestamp: new Date().toISOString(),
    });
};

export const getAdminStatsHandler = async (
    _req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const result = await adminService.getStats();

        res.status(200).json(result);
    } catch (error: unknown) {
        next(error);
    }
};

export const getAdminUsersHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { page, limit, skip } = parsePagination(req.query, {
            defaultLimit: 20,
            maxLimit: 50,
        });

        const search = parseSearch(req.query, 'search', {
            minLength: 2,
            maxLength: 100,
        });

        const role = parseEnumOptional(req.query, 'role', USER_ROLES);
        const status = parseEnumOptional(req.query, 'status', USER_STATUSES);
        const { from, to } = parseDateRange(
            req.query,
            'lastLoginFrom',
            'lastLoginTo',
        );

        const result = await adminService.getUsers({
            page,
            limit,
            skip,
            search,
            role,
            status,
            lastLoginFrom: from,
            lastLoginTo: to,
        });

        res.status(200).json(result);
    } catch (error: unknown) {
        next(error);
    }
};

export const getAdminCoursesHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { page, limit, skip } = parsePagination(req.query, {
            defaultLimit: 20,
            maxLimit: 50,
        });

        const search = parseSearch(req.query, 'search', {
            minLength: 2,
            maxLength: 100,
        });

        const result = await adminService.getCourses({
            page,
            limit,
            skip,
            search,
        });

        res.status(200).json(result);
    } catch (error: unknown) {
        next(error);
    }
};

export const changeAdminUserRoleHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = parseAdminUserIdParam(req);
        const payload = validateChangeUserRoleBody(req.body);

        const result = await adminService.changeUserRole(userId, payload.role);

        res.status(200).json(result);
    } catch (error: unknown) {
        next(error);
    }
};

export const forceLogoutAdminUserHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = parseAdminUserIdParam(req);

        const result = await adminService.forceLogoutUser(userId);

        res.status(200).json(result);
    } catch (error: unknown) {
        next(error);
    }
};

export const sendAdminNotificationHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedAdmin = getAuthenticatedAdmin(req);
        const payload = validateSendAdminNotificationBody(req.body);

        const adminIdentity = await adminService.getAdminIdentity(
            authenticatedAdmin.id,
        );

        const result = await adminService.sendAdminNotification(payload, {
            byAdminId: adminIdentity.id,
            byAdminEmail: adminIdentity.email,
        });

        res.status(200).json(result);
    } catch (error: unknown) {
        next(error);
    }
};

export const sendAdminMessageHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedAdmin = getAuthenticatedAdmin(req);
        const payload = validateSendAdminMessageBody(req.body);

        const result = await adminService.sendAdminMessage(payload, {
            byAdminId: authenticatedAdmin.id,
        });

        res.status(200).json(result);
    } catch (error: unknown) {
        next(error);
    }
};