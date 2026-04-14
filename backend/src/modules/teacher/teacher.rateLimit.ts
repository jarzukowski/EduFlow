import rateLimit, {
    ipKeyGenerator,
    type RateLimitRequestHandler,
} from 'express-rate-limit';

import { AppError } from '../../common/errors/AppError';

const buildTeacherSuggestRateLimitKey = (
    request: Parameters<RateLimitRequestHandler>[0],
): string => {
    const authenticatedUserId =
        request.user && typeof request.user.id === 'string'
            ? request.user.id.trim()
            : '';

    if (authenticatedUserId) {
        return `teacher-suggest:user:${authenticatedUserId}`;
    }

    return `teacher-suggest:ip:${ipKeyGenerator(request.ip ?? '')}`;
};

export const teacherSuggestLimiter = rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: buildTeacherSuggestRateLimitKey,
    handler: (_request, _response, next) => {
        next(
            new AppError(
                'TOO_MANY_REQUESTS',
                429,
                'Too many student suggestions requests. Please slow down.',
            ),
        );
    },
});