import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Application, type Request, type Response } from 'express';

import { AppError } from './common/errors/AppError';
import { config } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { router } from './routes';

export const app: Application = express();

if (config.nodeEnv === 'production') {
    app.set('trust proxy', 1);
}

app.use(
    cors({
        origin: config.frontendOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: config.nodeEnv,
    });
});

app.use(router);

app.use((_req, _res, next) => {
    next(new AppError('NOT_FOUND', 404, 'Not found'));
});

app.use(errorHandler);
