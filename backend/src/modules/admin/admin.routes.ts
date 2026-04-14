import { Router } from 'express';

import {
    changeAdminUserRoleHandler,
    forceLogoutAdminUserHandler,
    getAdminCoursesHandler,
    getAdminHealthHandler,
    getAdminStatsHandler,
    getAdminUsersHandler,
    sendAdminMessageHandler,
    sendAdminNotificationHandler,
} from './admin.controller';

export const adminRouter = Router();

adminRouter.get('/health', getAdminHealthHandler);

adminRouter.get('/stats', getAdminStatsHandler);
adminRouter.get('/users', getAdminUsersHandler);
adminRouter.get('/courses', getAdminCoursesHandler);

adminRouter.patch('/users/:id/role', changeAdminUserRoleHandler);
adminRouter.post('/users/:id/force-logout', forceLogoutAdminUserHandler);

adminRouter.post('/notifications', sendAdminNotificationHandler);
adminRouter.post('/messages', sendAdminMessageHandler);