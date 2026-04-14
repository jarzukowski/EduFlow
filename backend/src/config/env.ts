import * as dotenv from 'dotenv';

dotenv.config();

type NodeEnv = 'development' | 'test' | 'production';

const getOptionalEnvVar = (name: string): string | undefined => {
    const value = process.env[name];

    if (!value || value.trim() === '') {
        return undefined;
    }

    return value.trim();
};

const getRequiredEnvVar = (name: string): string => {
    const value = getOptionalEnvVar(name);

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
};

const parseNodeEnv = (value: string | undefined): NodeEnv => {
    if (!value) {
        return 'development';
    }

    if (value === 'development' || value === 'test' || value === 'production') {
        return value;
    }

    throw new Error(
        `Invalid NODE_ENV value: "${value}". Expected "development", "test" or "production".`,
    );
};

const parsePort = (value: string | undefined, fallback: number): number => {
    if (!value) {
        return fallback;
    }

    const parsedPort = Number(value);

    if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
        throw new Error(`Invalid PORT value: "${value}". It must be a positive integer.`);
    }

    return parsedPort;
};

const parsePositiveInteger = (
    value: string | undefined,
    fallback: number,
    envName: string,
): number => {
    if (!value) {
        return fallback;
    }

    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
        throw new Error(`Invalid ${envName} value: "${value}". It must be a positive integer.`);
    }

    return parsedValue;
};

const parseOrigin = (value: string | undefined, fallback?: string): string => {
    const resolvedValue = value ?? fallback;

    if (!resolvedValue) {
        throw new Error('Missing FRONTEND_ORIGIN configuration.');
    }

    try {
        const parsedUrl = new URL(resolvedValue);
        return parsedUrl.origin;
    } catch {
        throw new Error(
            `Invalid FRONTEND_ORIGIN value: "${resolvedValue}". It must be a valid absolute URL.`,
        );
    }
};

const nodeEnv = parseNodeEnv(getOptionalEnvVar('NODE_ENV'));
const isProd = nodeEnv === 'production';

const databaseUrl = getRequiredEnvVar('DATABASE_URL');

try {
    new URL(databaseUrl);
} catch {
    throw new Error(
        `Invalid DATABASE_URL value. It must be a valid URL, got: "${databaseUrl}".`,
    );
}

const port = parsePort(getOptionalEnvVar('PORT'), 3000);

const jwtAccessSecret = isProd
    ? getRequiredEnvVar('JWT_ACCESS_SECRET')
    : getOptionalEnvVar('JWT_ACCESS_SECRET') ?? 'dev_access_secret';

const jwtAccessExpiresIn = getOptionalEnvVar('JWT_ACCESS_EXPIRES_IN') ?? '15m';
const jwtRefreshExpiresIn = getOptionalEnvVar('JWT_REFRESH_EXPIRES_IN') ?? '7d';

const frontendOrigin = parseOrigin(
    getOptionalEnvVar('FRONTEND_ORIGIN'),
    'http://localhost:5173',
);

const maxActiveSessionsPerUser = parsePositiveInteger(
    getOptionalEnvVar('AUTH_MAX_ACTIVE_SESSIONS_PER_USER'),
    10,
    'AUTH_MAX_ACTIVE_SESSIONS_PER_USER',
);

const sessionRetentionDays = parsePositiveInteger(
    getOptionalEnvVar('AUTH_SESSION_RETENTION_DAYS'),
    30,
    'AUTH_SESSION_RETENTION_DAYS',
);

export const config = {
    nodeEnv,
    databaseUrl,
    port,
    isDev: nodeEnv === 'development',
    isTest: nodeEnv === 'test',
    isProd,
    jwtAccessSecret,
    jwtAccessExpiresIn,
    jwtRefreshExpiresIn,
    frontendOrigin,
    maxActiveSessionsPerUser,
    sessionRetentionDays,
} as const;