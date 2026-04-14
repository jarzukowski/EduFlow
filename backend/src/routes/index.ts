import { Router } from 'express';

import { requireAuth } from '../middlewares/requireAuth';
import { requireRole } from '../middlewares/requireRole';

import { adminRouter } from '../modules/admin/admin.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { coursesRouter } from '../modules/courses/courses.routes';
import { lessonsRouter } from '../modules/lessons/lessons.routes';
import { messagesRouter } from '../modules/messages/messages.routes';
import { notificationsRouter } from '../modules/notifications/notifications.routes';
import { studentRouter } from '../modules/student/student.routes';
import { teacherRouter } from '../modules/teacher/teacher.routes';

export const router = Router();

router.use('/auth', authRoutes);

router.use('/courses', requireAuth, coursesRouter);
router.use('/lessons', requireAuth, lessonsRouter);
router.use('/notifications', requireAuth, notificationsRouter);
router.use('/messages', requireAuth, messagesRouter);

router.use('/student', requireAuth, requireRole('STUDENT'), studentRouter);
router.use('/teacher', requireAuth, requireRole('TEACHER', 'ADMIN'), teacherRouter);
router.use('/admin', requireAuth, requireRole('ADMIN'), adminRouter);