import { Router } from 'express';

import { lessonPdfUploadMiddleware } from '../lessons/lessons.controller';

import {
    createTeacherLessonHandler,
    deleteTeacherLessonHandler,
    deleteTeacherLessonPdfHandler,
    enrollStudentToCourseHandler,
    getCourseEnrollmentsHandler,
    getTeacherCoursesHandler,
    getTeacherLessonsForCourseHandler,
    suggestStudentsHandler,
    unenrollStudentFromCourseHandler,
    updateTeacherLessonHandler,
    uploadTeacherLessonPdfHandler,
} from './teacher.controller';

import { teacherSuggestLimiter } from './teacher.rateLimit';

export const teacherRouter = Router();

teacherRouter.get('/courses', getTeacherCoursesHandler);
teacherRouter.get('/courses/:courseId/lessons', getTeacherLessonsForCourseHandler);

teacherRouter.get(
    '/courses/:courseId/enrollments',
    getCourseEnrollmentsHandler,
);
teacherRouter.post(
    '/courses/:courseId/enrollments',
    enrollStudentToCourseHandler,
);
teacherRouter.delete(
    '/courses/:courseId/enrollments/:studentId',
    unenrollStudentFromCourseHandler,
);

teacherRouter.get(
    '/students/suggest',
    teacherSuggestLimiter,
    suggestStudentsHandler,
);

teacherRouter.post(
    '/courses/:courseId/lessons',
    lessonPdfUploadMiddleware,
    createTeacherLessonHandler,
);

teacherRouter.put(
    '/lessons/:id',
    lessonPdfUploadMiddleware,
    updateTeacherLessonHandler,
);

teacherRouter.delete('/lessons/:id', deleteTeacherLessonHandler);

teacherRouter.post(
    '/lessons/:id/pdf',
    lessonPdfUploadMiddleware,
    uploadTeacherLessonPdfHandler,
);

teacherRouter.delete('/lessons/:id/pdf', deleteTeacherLessonPdfHandler);