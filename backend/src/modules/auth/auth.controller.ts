import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../common/errors/AppError';
import { authService } from './auth.service';
import { clearRefreshCookie, REFRESH_COOKIE_NAME, setRefreshCookie } from './auth.cookies';
import { sha256 } from './auth.crypto';
import { mapAuthResultToAuthResponse, mapUserToUserResponse } from './auth.mapper';
import { validateLoginBody, validateRegisterBody } from './auth.validation';

const getRequestMeta = (req: Request): { ip: string | undefined; userAgent: string | undefined } => {
    return {
        ip: req.ip,
        userAgent: req.get('user-agent') ?? undefined,
    };
};

const getRefreshTokenFromCookie = (req: Request): string | undefined => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (typeof refreshToken !== 'string') {
        return undefined;
    }

    const trimmedRefreshToken = refreshToken.trim();

    return trimmedRefreshToken ? trimmedRefreshToken : undefined;
};

const getCurrentTokenHash = (req: Request): string | undefined => {
    const refreshToken = getRefreshTokenFromCookie(req);

    if (!refreshToken) {
        return undefined;
    }

    return sha256(refreshToken);
};

export const registerController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const registerDto = validateRegisterBody(req.body);
        const createdUser = await authService.register(registerDto);

        res.status(201).json(mapUserToUserResponse(createdUser));
    } catch (error: unknown) {
        next(error);
    }
};

export const loginController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const loginDto = validateLoginBody(req.body);
        const authResult = await authService.login(loginDto, getRequestMeta(req));

        setRefreshCookie(res, authResult.refreshToken);
        res.status(200).json(mapAuthResultToAuthResponse(authResult));
    } catch (error: unknown) {
        next(error);
    }
};

export const refreshController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const refreshToken = getRefreshTokenFromCookie(req);

        if (!refreshToken) {
            throw new AppError('UNAUTHORIZED', 401, 'Refresh token missing');
        }

        const authResult = await authService.refreshTokens(refreshToken, getRequestMeta(req));

        setRefreshCookie(res, authResult.refreshToken);
        res.status(200).json(mapAuthResultToAuthResponse(authResult));
    } catch (error: unknown) {
        next(error);
    }
};

export const logoutController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const refreshToken = getRefreshTokenFromCookie(req);

        clearRefreshCookie(res);

        if (!refreshToken) {
            res.status(204).send();
            return;
        }

        await authService.logout(refreshToken);

        res.status(204).send();
    } catch (error: unknown) {
        next(error);
    }
};

export const sessionsController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedUser = req.user;

        if (!authenticatedUser) {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const sessions = await authService.getSessions(
            authenticatedUser.id,
            getCurrentTokenHash(req),
        );

        res.status(200).json(sessions);
    } catch (error: unknown) {
        next(error);
    }
};

export const revokeSessionController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedUser = req.user;

        if (!authenticatedUser) {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const sessionId = req.params.id;
        const revokeResult = await authService.revokeSession(
            authenticatedUser.id,
            sessionId,
            getCurrentTokenHash(req),
        );

        if (revokeResult.wasCurrent) {
            clearRefreshCookie(res);
        }

        res.status(200).json({
            revokedId: sessionId,
            wasCurrent: revokeResult.wasCurrent,
        });
    } catch (error: unknown) {
        next(error);
    }
};

export const revokeOtherSessionsController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedUser = req.user;

        if (!authenticatedUser) {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const result = await authService.revokeOtherSessions(
            authenticatedUser.id,
            getCurrentTokenHash(req),
        );

        res.status(200).json(result);
    } catch (error: unknown) {
        next(error);
    }
};

export const revokeAllSessionsController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedUser = req.user;

        if (!authenticatedUser) {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const result = await authService.revokeAllSessions(authenticatedUser.id);

        clearRefreshCookie(res);
        res.status(200).json(result);
    } catch (error: unknown) {
        next(error);
    }
};

export const meController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedUser = req.user;

        if (!authenticatedUser) {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        const currentUser = await authService.getCurrentUser(authenticatedUser.id);

        res.status(200).json(mapUserToUserResponse(currentUser));
    } catch (error: unknown) {
        next(error);
    }
};
