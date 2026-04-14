import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import {AppError} from '../../common/errors/AppError';
import {db} from '../../db/client';

import {authConfig} from './auth.config';
import {generateOpaqueToken, sha256} from './auth.crypto';
import {
    AuthResult,
    CurrentUser,
    LoginDto,
    RegisterDto, RevokeSessionsResponseDto,
    SessionsResponseDto,
    UserRole,
} from './auth.types';
import {parseDurationToMs} from './auth.utils';

type RefreshTokenMeta = {
    ip?: string;
    userAgent?: string;
};

type CreatedRefreshToken = {
    id: string;
    plain: string;
    expiresAt: Date;
};

class AuthService {
    async register(input: RegisterDto): Promise<CurrentUser> {
        const { email, username, password } = input;

        const existingEmail = await db.user.findUnique({ where: { email } });

        if (existingEmail) {
            throw new AppError('EMAIL_TAKEN', 409, 'User with this email already exists');
        }

        const existingUsername = await db.user.findUnique({ where: { username } });

        if (existingUsername) {
            throw new AppError('USERNAME_TAKEN', 409, 'User with this username already exists');
        }

        const passwordHash = await bcrypt.hash(password, 12);

        return await db.user.create({
            data: {
                email,
                username,
                passwordHash,
            },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
            },
        });
    }

    async login(input: LoginDto, meta?: RefreshTokenMeta): Promise<AuthResult> {
        const { email, password, deviceId } = input;

        const user = await db.user.findUnique({ where: { email } });

        if (!user) {
            throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
        }

        if (user.isActive === false) {
            throw new AppError('FORBIDDEN', 403, 'Account is blocked');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
        }

        const now = new Date();

        await db.user.update({
            where: { id: user.id },
            data: { lastLoginAt: now },
            select: { id: true },
        });

        const accessToken = this.generateAccessToken(user.id, user.role);

        const createdRefreshToken = await this.createRefreshToken(
            user.id,
            {
                ip: meta?.ip,
                userAgent: meta?.userAgent,
            },
            deviceId,
        );

        return {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            accessToken,
            refreshToken: createdRefreshToken.plain,
        };
    }

    async refreshTokens(
        refreshTokenPlain: string,
        meta?: RefreshTokenMeta,
    ): Promise<AuthResult> {
        const tokenHash = sha256(refreshTokenPlain);

        const storedToken = await db.refreshToken.findUnique({
            where: { tokenHash },
            include: { user: true },
        });

        if (!storedToken) {
            throw new AppError('INVALID_REFRESH_TOKEN', 401, 'Invalid refresh token');
        }

        if (storedToken.revokedAt) {
            throw new AppError('INVALID_REFRESH_TOKEN', 401, 'Refresh token revoked');
        }

        if (storedToken.replacedBy) {
            throw new AppError('INVALID_REFRESH_TOKEN', 401, 'Refresh token already used');
        }

        const now = new Date();

        if (storedToken.expiresAt <= now) {
            throw new AppError('INVALID_REFRESH_TOKEN', 401, 'Refresh token expired');
        }

        const user = storedToken.user;

        if (user.isActive === false) {
            throw new AppError('FORBIDDEN', 403, 'Account is blocked');
        }

        await db.user.update({
            where: { id: user.id },
            data: { lastLoginAt: now },
            select: { id: true },
        });

        const accessToken = this.generateAccessToken(user.id, user.role);
        const createdRefreshToken = await this.createRefreshToken(user.id, meta);

        await db.refreshToken.update({
            where: { id: storedToken.id },
            data: {
                revokedAt: now,
                replacedBy: createdRefreshToken.id,
                lastUsedAt: now,
                ip: meta?.ip ?? storedToken.ip,
                userAgent: meta?.userAgent ?? storedToken.userAgent,
            },
        });

        return {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            accessToken,
            refreshToken: createdRefreshToken.plain,
        };
    }

    async logout(refreshTokenPlain: string): Promise<void> {
        const tokenHash = sha256(refreshTokenPlain);

        const storedToken = await db.refreshToken.findUnique({
            where: { tokenHash },
            select: { id: true, revokedAt: true },
        });

        if (!storedToken) {
            return;
        }

        if (storedToken.revokedAt) {
            return;
        }

        const now = new Date();

        await db.refreshToken.update({
            where: { id: storedToken.id },
            data: {
                revokedAt: now,
                lastUsedAt: now,
            },
        });
    }

    async getSessions(userId: string, currentTokenHash?: string): Promise<SessionsResponseDto> {
        const sessions = await db.refreshToken.findMany({
            where: { userId },
            orderBy: [{ revokedAt: 'asc' }, { createdAt: 'desc' }],
            select: {
                id: true,
                tokenHash: true,
                createdAt: true,
                lastUsedAt: true,
                expiresAt: true,
                revokedAt: true,
                ip: true,
                userAgent: true,
            },
        });

        return {
            items: sessions.map((session) => ({
                id: session.id,
                createdAt: session.createdAt.toISOString(),
                lastUsedAt: session.lastUsedAt ? session.lastUsedAt.toISOString() : null,
                expiresAt: session.expiresAt.toISOString(),
                revokedAt: session.revokedAt ? session.revokedAt.toISOString() : null,
                ip: session.ip ?? null,
                userAgent: session.userAgent ?? null,
                isCurrent: Boolean(currentTokenHash) && session.tokenHash === currentTokenHash,
            })),
        };
    }

    async revokeSession(
        userId: string,
        sessionId: string,
        currentTokenHash?: string,
    ): Promise<{ wasCurrent: boolean }> {
        const session = await db.refreshToken.findFirst({
            where: { id: sessionId, userId },
            select: { id: true, tokenHash: true, revokedAt: true },
        });

        if (!session) {
            throw new AppError('SESSION_NOT_FOUND', 404, 'Session not found');
        }

        const now = new Date();
        const wasCurrent = Boolean(currentTokenHash) && session.tokenHash === currentTokenHash;

        if (!session.revokedAt) {
            await db.refreshToken.update({
                where: { id: session.id },
                data: {
                    revokedAt: now,
                    lastUsedAt: now,
                },
            });
        }

        return { wasCurrent };
    }

    async revokeOtherSessions(
        userId: string,
        currentTokenHash?: string,
    ): Promise<RevokeSessionsResponseDto> {
        const now = new Date();

        const whereClause = currentTokenHash
            ? { userId, revokedAt: null, NOT: { tokenHash: currentTokenHash } }
            : { userId, revokedAt: null };

        const result = await db.refreshToken.updateMany({
            where: whereClause,
            data: {
                revokedAt: now,
                lastUsedAt: now,
            },
        });

        return { revokedCount: result.count };
    }

    async revokeAllSessions(userId: string): Promise<RevokeSessionsResponseDto> {
        const now = new Date();

        const result = await db.refreshToken.updateMany({
            where: {
                userId,
                revokedAt: null,
                expiresAt: { gt: now },
            },
            data: {
                revokedAt: now,
                lastUsedAt: now,
            },
        });

        return { revokedCount: result.count };
    }

    async getCurrentUser(userId: string): Promise<CurrentUser> {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
            },
        });

        if (!user) {
            throw new AppError('USER_NOT_FOUND', 404, 'User not found');
        }

        return user;
    }

    private generateAccessToken(userId: string, role: UserRole): string {
        return jwt.sign(
            { sub: userId, role } as jwt.JwtPayload,
            authConfig.accessTokenSecret,
            { expiresIn: authConfig.accessTokenExpiresIn },
        );
    }

    private async createRefreshToken(
        userId: string,
        meta?: RefreshTokenMeta,
        deviceId?: string,
    ): Promise<CreatedRefreshToken> {
        await this.cleanupUserSessions(userId);

        const now = new Date();

        if (deviceId) {
            await db.refreshToken.updateMany({
                where: {
                    userId,
                    deviceId,
                    revokedAt: null,
                    expiresAt: { gt: now },
                },
                data: {
                    revokedAt: now,
                    lastUsedAt: now,
                },
            });
        }

        const plain = generateOpaqueToken(48);
        const tokenHash = sha256(plain);
        const expiresAt = new Date(Date.now() + parseDurationToMs(authConfig.refreshTokenExpiresIn));

        const createdRefreshToken = await db.refreshToken.create({
            data: {
                tokenHash,
                userId,
                deviceId: deviceId ?? null,
                expiresAt,
                ip: meta?.ip ?? null,
                userAgent: meta?.userAgent ?? null,
                lastUsedAt: null,
                revokedAt: null,
                replacedBy: null,
            },
            select: {
                id: true,
                expiresAt: true,
            },
        });

        await this.enforceActiveSessionLimit(userId);

        return {
            id: createdRefreshToken.id,
            plain,
            expiresAt: createdRefreshToken.expiresAt,
        };
    }

    private cleanupUserSessions = async (userId: string): Promise<void> => {
        const now = new Date();

        await db.refreshToken.deleteMany({
            where: {
                userId,
                expiresAt: { lte: now },
            },
        });

        const retentionMs = authConfig.sessionRetentionDays * 24 * 60 * 60 * 1000;
        const cutoff = new Date(Date.now() - retentionMs);

        await db.refreshToken.deleteMany({
            where: {
                userId,
                revokedAt: { not: null, lte: cutoff },
            },
        });
    };

    private enforceActiveSessionLimit = async (userId: string): Promise<void> => {
        const now = new Date();

        const activeSessions = await db.refreshToken.findMany({
            where: {
                userId,
                revokedAt: null,
                expiresAt: { gt: now },
            },
            orderBy: { createdAt: 'asc' },
            select: { id: true },
        });

        const maxActiveSessions = authConfig.maxActiveSessionsPerUser;

        if (activeSessions.length <= maxActiveSessions) {
            return;
        }

        const sessionsToRevoke = activeSessions.slice(0, activeSessions.length - maxActiveSessions);
        const sessionIdsToRevoke = sessionsToRevoke.map((session) => session.id);

        await db.refreshToken.updateMany({
            where: {
                id: { in: sessionIdsToRevoke },
            },
            data: {
                revokedAt: now,
                lastUsedAt: now,
            },
        });
    };
}

export const authService = new AuthService();
