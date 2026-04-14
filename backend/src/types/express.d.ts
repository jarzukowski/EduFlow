import 'express';
import type { UserRole } from '../modules/auth/auth.types';

declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            id: string;
            role: UserRole;
        };
    }
}