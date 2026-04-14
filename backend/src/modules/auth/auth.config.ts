import type { SignOptions } from 'jsonwebtoken';

import { config } from '../../config/env';

type JwtExpiresIn = SignOptions['expiresIn'];

export const authConfig = {
    accessTokenExpiresIn: config.jwtAccessExpiresIn as JwtExpiresIn,
    refreshTokenExpiresIn: config.jwtRefreshExpiresIn,
    accessTokenSecret: config.jwtAccessSecret,
    maxActiveSessionsPerUser: config.maxActiveSessionsPerUser,
    sessionRetentionDays: config.sessionRetentionDays,
} as const;