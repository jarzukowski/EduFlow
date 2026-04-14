import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

import { AppError } from '../common/errors/AppError';
import type { UserRole } from '../modules/auth/auth.types';

const getAccessTokenSecret = (): string => {
    const rawSecret = process.env.JWT_ACCESS_SECRET;

    if (!rawSecret || rawSecret.trim().length < 20) {
        throw new Error('JWT_ACCESS_SECRET is missing or too short');
    }

    return rawSecret;
};

const isUserRole = (value: unknown): value is UserRole => {
    return value === 'STUDENT' || value === 'TEACHER' || value === 'ADMIN';
};

export const requireAuth = (
    req: Request,
    _res: Response,
    next: NextFunction,
): void => {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader?.startsWith('Bearer ')) {
        next(new AppError('UNAUTHORIZED', 401, 'Authorization header missing or malformed'));
        return;
    }

    const accessToken = authorizationHeader.slice('Bearer '.length).trim();

    if (!accessToken) {
        next(new AppError('UNAUTHORIZED', 401, 'Authorization token missing'));
        return;
    }

    try {
        const accessTokenSecret = getAccessTokenSecret();
        const decodedToken = jwt.verify(accessToken, accessTokenSecret) as JwtPayload;

        const userId = decodedToken.sub;
        const userRole = decodedToken.role;

        if (typeof userId !== 'string' || !isUserRole(userRole)) {
            next(new AppError('UNAUTHORIZED', 401, 'Invalid access token payload'));
            return;
        }

        req.user = {
            id: userId,
            role: userRole,
        };

        next();
    } catch {
        next(new AppError('UNAUTHORIZED', 401, 'Invalid or expired access token'));
    }
};