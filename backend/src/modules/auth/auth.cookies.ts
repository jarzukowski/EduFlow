import type { CookieOptions, Response } from 'express';

import { authConfig } from './auth.config';
import { parseDurationToMs } from './auth.utils';

export const REFRESH_COOKIE_NAME = 'refreshToken';

const isProductionEnvironment = process.env.NODE_ENV === 'production';

const getRefreshCookieOptions = (): CookieOptions => {
    const maxAge = parseDurationToMs(authConfig.refreshTokenExpiresIn);

    return {
        httpOnly: true,
        secure: isProductionEnvironment,
        sameSite: 'lax',
        path: '/auth',
        maxAge,
    };
};

export const setRefreshCookie = (res: Response, refreshToken: string): void => {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
};

export const clearRefreshCookie = (res: Response): void => {
    res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
};