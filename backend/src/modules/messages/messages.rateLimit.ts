import rateLimit, {ipKeyGenerator, type RateLimitRequestHandler} from 'express-rate-limit';

import { AppError } from '../../common/errors/AppError';

const buildMessagesRateLimitKey = (
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

const buildInboxRateLimitKey = (
    request: Parameters<RateLimitRequestHandler>[0],
): string => buildMessagesRateLimitKey(request, 'messages-inbox');

const buildConversationRateLimitKey = (
    request: Parameters<RateLimitRequestHandler>[0],
): string => buildMessagesRateLimitKey(request, 'messages-conversation');

const buildSendMessageRateLimitKey = (
    request: Parameters<RateLimitRequestHandler>[0],
): string => buildMessagesRateLimitKey(request, 'messages-send');

const buildMarkReadRateLimitKey = (
    request: Parameters<RateLimitRequestHandler>[0],
): string => buildMessagesRateLimitKey(request, 'messages-mark-read');

const buildStartConversationRateLimitKey = (
    request: Parameters<RateLimitRequestHandler>[0],
): string => buildMessagesRateLimitKey(request, 'messages-start');

export const inboxLimiter = rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: buildInboxRateLimitKey,
    handler: (_request, _response, next) => {
        next(
            new AppError(
                'TOO_MANY_REQUESTS',
                429,
                'Too many inbox requests. Please slow down.',
            ),
        );
    },
});

export const conversationLimiter = rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: buildConversationRateLimitKey,
    handler: (_request, _response, next) => {
        next(
            new AppError(
                'TOO_MANY_REQUESTS',
                429,
                'Too many conversation requests. Please slow down.',
            ),
        );
    },
});

export const sendMessageLimiter = rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: buildSendMessageRateLimitKey,
    handler: (_request, _response, next) => {
        next(
            new AppError(
                'TOO_MANY_REQUESTS',
                429,
                'Too many messages sent. Please slow down.',
            ),
        );
    },
});

export const markReadLimiter = rateLimit({
    windowMs: 60_000,
    limit: 240,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: buildMarkReadRateLimitKey,
    handler: (_request, _response, next) => {
        next(
            new AppError(
                'TOO_MANY_REQUESTS',
                429,
                'Too many read updates. Please slow down.',
            ),
        );
    },
});

export const startConversationLimiter = rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: buildStartConversationRateLimitKey,
    handler: (_request, _response, next) => {
        next(
            new AppError(
                'TOO_MANY_REQUESTS',
                429,
                'Too many conversation start requests. Please slow down.',
            ),
        );
    },
});