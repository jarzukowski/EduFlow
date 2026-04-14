import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../common/errors/AppError';
import type { UserRole } from '../modules/auth/auth.types';

export const requireRole = (...allowedRoles: UserRole[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const authenticatedUser = req.user;

        if (!authenticatedUser) {
            next(new AppError('UNAUTHORIZED', 401, 'You must be logged in'));
            return;
        }

        if (!allowedRoles.includes(authenticatedUser.role)) {
            next(new AppError('FORBIDDEN', 403, 'Insufficient permissions'));
            return;
        }

        next();
    };
};