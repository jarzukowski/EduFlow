import rateLimit, {ipKeyGenerator, type RateLimitRequestHandler} from 'express-rate-limit';

import { AppError } from '../../common/errors/AppError';

const buildStudentCompletionRateLimitKey = (request: Parameters<RateLimitRequestHandler>[0]): string => {
    const authenticatedUserId =
        request.user && typeof request.user.id === 'string'
            ? request.user.id.trim()
            : '';

    if (authenticatedUserId) {
        return `student-completion:user:${authenticatedUserId}`;
    }

    return `student-completion:ip:${ipKeyGenerator(request.ip ?? '')}`;
};

export const studentCompletionLimiter = rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: buildStudentCompletionRateLimitKey,
    handler: (_request, _response, next) => {
        next(
            new AppError(
                'TOO_MANY_REQUESTS',
                429,
                'Too many completion updates. Please slow down.',
            ),
        );
    },
});