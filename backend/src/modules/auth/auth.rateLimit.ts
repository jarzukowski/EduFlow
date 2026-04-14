import type { NextFunction, Request, Response } from 'express';

import rateLimit, {
    ipKeyGenerator,
    type RateLimitRequestHandler,
} from 'express-rate-limit';

import { AppError } from '../../common/errors/AppError';

import { REFRESH_COOKIE_NAME } from './auth.cookies';
import { sha256 } from './auth.crypto';

const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const REFRESH_AND_LOGOUT_WINDOW_MS = 5 * 60 * 1000;

const LOGIN_IP_LIMIT = 20;
const LOGIN_EMAIL_LIMIT = 10;

const REGISTER_IP_LIMIT = 10;
const REGISTER_EMAIL_LIMIT = 5;

const REFRESH_LIMIT = 30;
const LOGOUT_LIMIT = 20;

type RequestBodyWithOptionalEmail = {
    email?: unknown;
};

type RateLimitOptions = {
    windowMs: number;
    limit: number;
    message: string;
    skipSuccessfulRequests?: boolean;
};

const normalizeEmail = (value: unknown): string | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmedValue = value.trim().toLowerCase();

    return trimmedValue.length > 0 ? trimmedValue : null;
};

const getSafeIpKey = (request: Request): string => {
    return ipKeyGenerator(request.ip ?? '');
};

const getRequestEmail = (request: Request): string | null => {
    const requestBody = request.body;

    if (!requestBody || typeof requestBody !== 'object' || Array.isArray(requestBody)) {
        return null;
    }

    const { email } = requestBody as RequestBodyWithOptionalEmail;

    return normalizeEmail(email);
};

const getRefreshTokenFromCookie = (request: Request): string | null => {
    const cookieValue = request.cookies?.[REFRESH_COOKIE_NAME];

    if (typeof cookieValue !== 'string') {
        return null;
    }

    const trimmedCookieValue = cookieValue.trim();

    return trimmedCookieValue.length > 0 ? trimmedCookieValue : null;
};

const getRefreshTokenRateLimitKey = (
    request: Request,
    namespace: string,
): string => {
    const refreshToken = getRefreshTokenFromCookie(request);

    if (refreshToken) {
        return `${namespace}:token:${sha256(refreshToken)}`;
    }

    return `${namespace}:ip:${getSafeIpKey(request)}`;
};

const createTooManyRequestsHandler = (
    message: string,
): ((request: Request, response: Response, next: NextFunction) => void) => {
    return (_request: Request, _response: Response, next: NextFunction): void => {
        next(new AppError('TOO_MANY_REQUESTS', 429, message));
    };
};

const createRateLimitByIp = (
    keyPrefix: string,
    options: RateLimitOptions,
): RateLimitRequestHandler => {
    return rateLimit({
        windowMs: options.windowMs,
        limit: options.limit,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,
        keyGenerator: (request: Request): string => {
            return `${keyPrefix}:ip:${getSafeIpKey(request)}`;
        },
        handler: createTooManyRequestsHandler(options.message),
    });
};

const createRateLimitByEmail = (
    keyPrefix: string,
    options: RateLimitOptions,
): RateLimitRequestHandler => {
    return rateLimit({
        windowMs: options.windowMs,
        limit: options.limit,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,
        keyGenerator: (request: Request): string => {
            const email = getRequestEmail(request);

            if (email) {
                return `${keyPrefix}:email:${email}`;
            }

            return `${keyPrefix}:ip:${getSafeIpKey(request)}`;
        },
        handler: createTooManyRequestsHandler(options.message),
    });
};

const createRateLimitByRefreshToken = (
    keyPrefix: string,
    options: Omit<RateLimitOptions, 'skipSuccessfulRequests'>,
): RateLimitRequestHandler => {
    return rateLimit({
        windowMs: options.windowMs,
        limit: options.limit,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (request: Request): string => {
            return getRefreshTokenRateLimitKey(request, keyPrefix);
        },
        handler: createTooManyRequestsHandler(options.message),
    });
};

export const registerIpLimiter = createRateLimitByIp('auth:register', {
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    limit: REGISTER_IP_LIMIT,
    message: 'Too many registration attempts. Please try again later.',
});

export const registerEmailLimiter = createRateLimitByEmail('auth:register', {
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    limit: REGISTER_EMAIL_LIMIT,
    message: 'Too many registration attempts for this email. Please try again later.',
});

export const loginIpLimiter = createRateLimitByIp('auth:login', {
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    limit: LOGIN_IP_LIMIT,
    message: 'Too many login attempts. Please try again later.',
    skipSuccessfulRequests: true,
});

export const loginEmailLimiter = createRateLimitByEmail('auth:login', {
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    limit: LOGIN_EMAIL_LIMIT,
    message: 'Too many login attempts for this account. Please try again later.',
    skipSuccessfulRequests: true,
});

export const refreshLimiter = createRateLimitByRefreshToken('auth:refresh', {
    windowMs: REFRESH_AND_LOGOUT_WINDOW_MS,
    limit: REFRESH_LIMIT,
    message: 'Too many refresh attempts. Please try again later.',
});

export const logoutLimiter = createRateLimitByRefreshToken('auth:logout', {
    windowMs: REFRESH_AND_LOGOUT_WINDOW_MS,
    limit: LOGOUT_LIMIT,
    message: 'Too many logout attempts. Please try again later.',
});