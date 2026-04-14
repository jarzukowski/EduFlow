import { PrismaClient, Prisma } from '../../generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { config } from '../config/env';

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
    // eslint-disable-next-line no-var
    var pgPool: Pool | undefined;
}

const prismaLogLevels: Prisma.LogLevel[] = config.isDev
    ? ['query', 'info', 'warn', 'error']
    : ['error'];

const getPool = (): Pool => {
    if (!global.pgPool) {
        global.pgPool = new Pool({
            connectionString: config.databaseUrl,
        });
    }

    return global.pgPool;
};

const createPrismaClient = (): PrismaClient => {
    const adapter = new PrismaPg(getPool());

    return new PrismaClient({
        adapter,
        log: prismaLogLevels,
    });
};

const getDatabaseClient = (): PrismaClient => {
    if (config.isDev) {
        if (!global.prisma) {
            global.prisma = createPrismaClient();
        }

        return global.prisma;
    }

    return createPrismaClient();
};

export const db = getDatabaseClient();

process.on('beforeExit', async () => {
    await db.$disconnect();
});