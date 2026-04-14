import rateLimit, {ipKeyGenerator, type RateLimitRequestHandler} from 'express-rate-limit';

import { AppError } from '../../common/errors/AppError';

const getAuthenticatedUserKey = (
    request: Parameters<RateLimitRequestHandler>[0],
    prefix: string,
): string => {
    const authenticatedUserId =
        request.user && typeof request.user.id === 'string'
            ? request.user.id.trim()
            : '';

    if (authenticatedUserId.length > 0) {
        return `${prefix}:user:${authenticatedUserId}`;
    }

    return `${prefix}:ip:${ipKeyGenerator(request.ip ?? '')}`;
};

const buildNotificationsListKey = (
    request: Parameters<RateLimitRequestHandler>[0],
): string => getAuthenticatedUserKey(request, 'notifications-list');

const buildNotificationsMarkReadKey = (
    request: Parameters<RateLimitRequestHandler>[0],
): string => getAuthenticatedUserKey(request, 'notifications-mark-read');

const buildNotificationsReadAllKey = (
    request: Parameters<RateLimitRequestHandler>[0],
): string => getAuthenticatedUserKey(request, 'notifications-read-all');

export const notificationsListLimiter = rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: buildNotificationsListKey,
    handler: (_request, _response, next) => {
        next(
            new AppError(
                'TOO_MANY_REQUESTS',
                429,
                'Too many notification list requests. Please slow down.',
            ),
        );
    },
});

export const notificationsMarkReadLimiter = rateLimit({
    windowMs: 60_000,
    limit: 240,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: buildNotificationsMarkReadKey,
    handler: (_request, _response, next) => {
        next(
            new AppError(
                'TOO_MANY_REQUESTS',
                429,
                'Too many notification read requests. Please slow down.',
            ),
        );
    },
});

export const notificationsReadAllLimiter = rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: buildNotificationsReadAllKey,
    handler: (_request, _response, next) => {
        next(
            new AppError(
                'TOO_MANY_REQUESTS',
                429,
                'Too many mark-all-read requests. Please slow down.',
            ),
        );
    },
});