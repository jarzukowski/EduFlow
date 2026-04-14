export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface RegisterDto {
    email: string;
    username: string;
    password: string;
}

export interface LoginDto {
    email: string;
    password: string;
    deviceId?: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthenticatedUser {
    userId: string;
    email: string;
    username: string;
    role: UserRole;
}

export type AuthResult = AuthenticatedUser & AuthTokens;

export interface CurrentUser {
    id: string;
    email: string;
    username: string;
    role: UserRole;
}

export interface SessionDto {
    id: string;
    createdAt: string;
    lastUsedAt: string | null;
    expiresAt: string;
    revokedAt: string | null;
    ip: string | null;
    userAgent: string | null;
    isCurrent: boolean;
}

export interface SessionsResponseDto {
    items: SessionDto[];
}

export interface RevokeSessionsResponseDto {
    revokedCount: number;
}
