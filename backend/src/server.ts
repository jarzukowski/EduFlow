import http from 'http';

import { app } from './app';
import { config } from './config/env';

export const startServer = (): http.Server => {
    const server = http.createServer(app);

    server.listen(config.port, () => {
        // eslint-disable-next-line no-console
        console.log(
            `[server] Listening on http://localhost:${config.port} (env: ${config.nodeEnv})`,
        );
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
        // eslint-disable-next-line no-console
        console.error('[server] Error while starting server:', error);

        if (error.code === 'EADDRINUSE') {
            // eslint-disable-next-line no-console
            console.error(
                `[server] Port ${config.port} is already in use. Change PORT in .env or stop the other process.`,
            );
        }

        process.exit(1);
    });

    const shutdown = (signal: NodeJS.Signals): void => {
        // eslint-disable-next-line no-console
        console.log(`[server] Received ${signal}, shutting down gracefully...`);

        server.close((error?: Error) => {
            if (error) {
                // eslint-disable-next-line no-console
                console.error('[server] Error during HTTP server close:', error);
                process.exit(1);
                return;
            }

            // eslint-disable-next-line no-console
            console.log('[server] HTTP server closed');
            process.exit(0);
        });

        setTimeout(() => {
            // eslint-disable-next-line no-console
            console.error('[server] Force exit after timeout');
            process.exit(1);
        }, 10_000).unref();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    return server;
};

if (require.main === module) {
    startServer();
}