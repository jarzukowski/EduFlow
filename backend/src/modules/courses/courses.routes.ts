import { Router } from 'express';

import { requireRole } from '../../middlewares/requireRole';

import {
    createCourseHandler,
    deleteCourseHandler,
    getCourseByIdHandler,
    getCourseLessonsHandler,
    getCoursesHandler,
    updateCourseHandler,
} from './courses.controller';

export const coursesRouter = Router();

coursesRouter.get('/', getCoursesHandler);
coursesRouter.get('/:id', getCourseByIdHandler);
coursesRouter.get('/:courseId/lessons', getCourseLessonsHandler);
coursesRouter.post(
    '/',
    requireRole('TEACHER', 'ADMIN'),
    createCourseHandler,
);

coursesRouter.put(
    '/:id',
    requireRole('TEACHER', 'ADMIN'),
    updateCourseHandler,
);

coursesRouter.delete(
    '/:id',
    requireRole('TEACHER', 'ADMIN'),
    deleteCourseHandler,
);
