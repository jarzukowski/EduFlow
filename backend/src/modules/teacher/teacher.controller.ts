import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../common/errors/AppError';
import { lessonsService } from '../lessons/lessons.service';
import {
    validateCreateLessonPayload,
    validateUpdateLessonPayload
} from '../lessons/lessons.validation';
import { teacherService } from './teacher.service';
import {
    requireNonEmptyStringParam,
    validateEnrollmentsPagination,
    validateEnrollStudentBody,
    validateSuggestQuery,
} from './teacher.validation';

export type AuthenticatedTeacherUser = {
    id: string;
    role: 'TEACHER' | 'ADMIN';
};

const isTeacherModuleRole = (
    value: unknown,
): value is AuthenticatedTeacherUser['role'] =>
    value === 'TEACHER' || value === 'ADMIN';

const getAuthenticatedActorOrThrow = (
    request: Request,
): AuthenticatedTeacherUser => {
    const user = request.user;

    if (!user || typeof user !== 'object') {
        throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
    }

    const userId =
        'id' in user && typeof user.id === 'string' ? user.id.trim() : '';

    const userRole = 'role' in user ? user.role : undefined;

    if (!userId || !isTeacherModuleRole(userRole)) {
        throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
    }

    return {
        id: userId,
        role: userRole,
    };
};

export const getTeacherCoursesHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedActor = getAuthenticatedActorOrThrow(request);

        const items = await teacherService.getTeacherCourses(
            authenticatedActor.id,
        );

        response.status(200).json(items);
    } catch (error) {
        next(error);
    }
};

export const getTeacherLessonsForCourseHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedActor = getAuthenticatedActorOrThrow(request);
        const courseId = requireNonEmptyStringParam(
            request.params.courseId,
            'courseId',
        );

        const items = await teacherService.getTeacherLessonsForCourse(
            authenticatedActor.id,
            courseId,
        );

        response.status(200).json(items);
    } catch (error) {
        next(error);
    }
};

export const suggestStudentsHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        getAuthenticatedActorOrThrow(request);

        const query = validateSuggestQuery(request.query.query);
        const items = await teacherService.suggestStudents(query);

        response.status(200).json(items);
    } catch (error) {
        next(error);
    }
};

export const getCourseEnrollmentsHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedActor = getAuthenticatedActorOrThrow(request);
        const courseId = requireNonEmptyStringParam(
            request.params.courseId,
            'courseId',
        );
        const { page, limit } = validateEnrollmentsPagination(request.query);

        const result = await teacherService.getCourseEnrollments(
            authenticatedActor.id,
            courseId,
            page,
            limit,
        );

        response.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const enrollStudentToCourseHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedActor = getAuthenticatedActorOrThrow(request);
        const courseId = requireNonEmptyStringParam(
            request.params.courseId,
            'courseId',
        );
        const { studentId } = validateEnrollStudentBody(request.body);

        const result = await teacherService.enrollStudentToCourse(
            authenticatedActor.id,
            courseId,
            studentId,
        );

        response.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const unenrollStudentFromCourseHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedActor = getAuthenticatedActorOrThrow(request);
        const courseId = requireNonEmptyStringParam(
            request.params.courseId,
            'courseId',
        );
        const studentId = requireNonEmptyStringParam(
            request.params.studentId,
            'studentId',
        );

        const result = await teacherService.unenrollStudentFromCourse(
            authenticatedActor.id,
            courseId,
            studentId,
        );

        response.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const createTeacherLessonHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedActor = getAuthenticatedActorOrThrow(request);
        const courseId = requireNonEmptyStringParam(
            request.params.courseId,
            'courseId',
        );
        const createLessonDto = validateCreateLessonPayload(request.body);

        const lesson = await lessonsService.createLesson(
            courseId,
            authenticatedActor,
            createLessonDto,
            request.file ?? null,
        );

        response.status(201).json(lesson);
    } catch (error) {
        next(error);
    }
};

export const updateTeacherLessonHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedActor = getAuthenticatedActorOrThrow(request);
        const lessonId = requireNonEmptyStringParam(
            request.params.id,
            'lessonId',
        );
        const updateLessonDto = validateUpdateLessonPayload(request.body);

        const lesson = await lessonsService.updateLesson(
            lessonId,
            authenticatedActor,
            updateLessonDto,
            request.file ?? null,
        );

        response.status(200).json(lesson);
    } catch (error) {
        next(error);
    }
};

export const deleteTeacherLessonHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedActor = getAuthenticatedActorOrThrow(request);
        const lessonId = requireNonEmptyStringParam(
            request.params.id,
            'lessonId',
        );

        await lessonsService.deleteLesson(lessonId, authenticatedActor);

        response.status(204).send();
    } catch (error) {
        next(error);
    }
};

export const uploadTeacherLessonPdfHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedActor = getAuthenticatedActorOrThrow(request);
        const lessonId = requireNonEmptyStringParam(
            request.params.id,
            'lessonId',
        );

        if (!request.file) {
            throw new AppError('BAD_REQUEST', 400, 'pdf file is required');
        }

        const lesson = await lessonsService.uploadLessonPdf(
            lessonId,
            authenticatedActor,
            request.file,
        );

        response.status(200).json(lesson);
    } catch (error) {
        next(error);
    }
};

export const deleteTeacherLessonPdfHandler = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedActor = getAuthenticatedActorOrThrow(request);
        const lessonId = requireNonEmptyStringParam(
            request.params.id,
            'lessonId',
        );

        await lessonsService.deleteLessonPdf(lessonId, authenticatedActor);

        response.status(204).send();
    } catch (error) {
        next(error);
    }
};
