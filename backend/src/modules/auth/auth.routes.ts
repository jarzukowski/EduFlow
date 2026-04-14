import { Router } from 'express';

import { requireAuth } from '../../middlewares/requireAuth';

import {
    loginController,
    logoutController,
    meController,
    refreshController,
    registerController,
    revokeAllSessionsController,
    revokeOtherSessionsController,
    revokeSessionController,
    sessionsController,
} from './auth.controller';
import {
    loginEmailLimiter,
    loginIpLimiter,
    logoutLimiter,
    refreshLimiter,
    registerEmailLimiter,
    registerIpLimiter,
} from './auth.rateLimit';

export const authRoutes = Router();

authRoutes.post('/register', registerIpLimiter, registerEmailLimiter, registerController);
authRoutes.post('/login', loginIpLimiter, loginEmailLimiter, loginController);
authRoutes.post('/refresh', refreshLimiter, refreshController);
authRoutes.post('/logout', logoutLimiter, logoutController);

authRoutes.get('/me', requireAuth, meController);
authRoutes.get('/sessions', requireAuth, sessionsController);
authRoutes.delete('/sessions/:id', requireAuth, revokeSessionController);
authRoutes.post('/sessions/revoke-others', requireAuth, revokeOtherSessionsController);
authRoutes.post('/sessions/revoke-all', requireAuth, revokeAllSessionsController);