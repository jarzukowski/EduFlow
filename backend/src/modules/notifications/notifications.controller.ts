import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../common/errors/AppError';
import { notificationsService } from './notifications.service';
import { validateListNotificationsQuery } from './notifications.validation';

import type { UserRole } from '../auth/auth.types';

type AuthenticatedUser = {
    id: string;
    role: UserRole;
};

const requireParamId = (value: unknown, paramName: string): string => {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new AppError('BAD_REQUEST', 400, `${paramName} is required`);
    }

    return value.trim();
};

const requireAuthenticatedUser = (request: Request): AuthenticatedUser => {
    const authenticatedUser = request.user;

    if (!authenticatedUser) {
        throw new AppError('UNAUTHORIZED', 401, 'Not authenticated');
    }

    return {
        id: authenticatedUser.id,
        role: authenticatedUser.role,
    };
};

export const listNotificationsHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedUser = requireAuthenticatedUser(request);
        const query = validateListNotificationsQuery(request.query);

        const notificationsResponse = await notificationsService.listForUser(
            authenticatedUser.id,
            query,
        );

        response.status(200).json(notificationsResponse);
    } catch (error) {
        next(error);
    }
};

export const markNotificationReadHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedUser = requireAuthenticatedUser(request);
        const notificationId = requireParamId(request.params.id, 'notificationId');

        await notificationsService.markRead(notificationId, authenticatedUser.id);

        response.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const markAllNotificationsReadHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedUser = requireAuthenticatedUser(request);

        const result = await notificationsService.markAllRead(authenticatedUser.id);

        response.status(200).json(result);
    } catch (error) {
        next(error);
    }
};