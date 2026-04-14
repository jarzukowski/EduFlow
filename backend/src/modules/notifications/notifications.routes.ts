import { Router } from 'express';

import {
    listNotificationsHandler,
    markAllNotificationsReadHandler,
    markNotificationReadHandler,
} from './notifications.controller';
import {
    notificationsListLimiter,
    notificationsMarkReadLimiter,
    notificationsReadAllLimiter,
} from './notifications.rateLimit';

export const notificationsRouter = Router();

notificationsRouter.get('/', notificationsListLimiter, listNotificationsHandler);
notificationsRouter.post('/read-all', notificationsReadAllLimiter, markAllNotificationsReadHandler);
notificationsRouter.post('/:id/read', notificationsMarkReadLimiter, markNotificationReadHandler);