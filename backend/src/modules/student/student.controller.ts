import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../common/errors/AppError';
import { studentService } from './student.service';
import {
    requireNonEmptyStringParam,
    validateUpdateLessonCompletionBody,
} from './student.validation';

type AuthenticatedStudentUser = {
    id: string;
    role: 'STUDENT';
};

const requireAuthenticatedStudentOrThrow = (req: Request): AuthenticatedStudentUser => {
    const authenticatedUser = req.user;

    if (!authenticatedUser) {
        throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
    }

    if (authenticatedUser.role !== 'STUDENT') {
        throw new AppError('FORBIDDEN', 403, 'Insufficient permissions');
    }

    return {
        id: authenticatedUser.id,
        role: authenticatedUser.role,
    };
};

export const getStudentCoursesHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedStudent = requireAuthenticatedStudentOrThrow(req);
        const studentCourses = await studentService.getStudentCourses(authenticatedStudent.id);

        res.status(200).json(studentCourses);
    } catch (error: unknown) {
        next(error);
    }
};

export const getStudentLessonsForCourseHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedStudent = requireAuthenticatedStudentOrThrow(req);
        const courseId = requireNonEmptyStringParam(req.params.courseId, 'courseId');

        const studentLessons = await studentService.getStudentLessonsForCourse(
            authenticatedStudent.id,
            courseId,
        );

        res.status(200).json(studentLessons);
    } catch (error: unknown) {
        next(error);
    }
};

export const updateLessonCompletionHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedStudent = requireAuthenticatedStudentOrThrow(req);
        const lessonId = requireNonEmptyStringParam(req.params.lessonId, 'lessonId');
        const { completed } = validateUpdateLessonCompletionBody(req.body);

        const response = await studentService.updateLessonCompletion(
            authenticatedStudent.id,
            lessonId,
            completed,
        );

        res.status(200).json(response);
    } catch (error: unknown) {
        next(error);
    }
};