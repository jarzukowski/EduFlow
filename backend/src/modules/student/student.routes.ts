import { Router } from 'express';
import {
    getStudentCoursesHandler,
    getStudentLessonsForCourseHandler,
    updateLessonCompletionHandler,
} from './student.controller';
import { studentCompletionLimiter } from './student.rateLimit';

export const studentRouter = Router();

studentRouter.get('/courses', getStudentCoursesHandler);
studentRouter.get('/courses/:courseId/lessons', getStudentLessonsForCourseHandler);
studentRouter.put(
    '/lessons/:lessonId/completion',
    studentCompletionLimiter,
    updateLessonCompletionHandler,
);