import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../common/errors/AppError';
import { lessonsService } from '../lessons/lessons.service';

import { coursesService } from './courses.service';
import { parseGetCoursesQuery } from './courses.utils';
import {
    validateCreateCourse,
    validateUpdateCourse,
} from './courses.validation';

const getAuthenticatedUser = (req: Request) => {
    if (!req.user) {
        throw new AppError('UNAUTHORIZED', 401, 'Not authenticated');
    }

    return req.user;
};

const parseCourseIdParam = (req: Request): string => {
    const courseId = req.params.id;

    if (typeof courseId !== 'string' || !courseId.trim()) {
        throw new AppError('VALIDATION_ERROR', 400, 'Invalid course id');
    }

    return courseId.trim();
};

const parseCourseIdFromNamedParam = (
    req: Request,
    paramName: 'id' | 'courseId',
): string => {
    const courseId = req.params[paramName];

    if (typeof courseId !== 'string' || !courseId.trim()) {
        throw new AppError('VALIDATION_ERROR', 400, 'Invalid course id');
    }

    return courseId.trim();
};

export const getCoursesHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const query = parseGetCoursesQuery(req.query);
        const result = await coursesService.getCoursesPaginated(query);

        res.status(200).json(result);
    } catch (error: unknown) {
        next(error);
    }
};

export const getCourseByIdHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const courseId = parseCourseIdParam(req);
        const course = await coursesService.getCourseById(courseId);

        res.status(200).json(course);
    } catch (error: unknown) {
        next(error);
    }
};

export const getCourseLessonsHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const courseId = parseCourseIdFromNamedParam(req, 'courseId');
        const lessons = await lessonsService.getLessonsByCourse(courseId);

        res.status(200).json(lessons);
    } catch (error: unknown) {
        next(error);
    }
};

export const createCourseHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedUser = getAuthenticatedUser(req);
        const dto = validateCreateCourse(req.body);

        const course = await coursesService.createCourse(
            authenticatedUser.id,
            dto,
        );

        res.status(201).json(course);
    } catch (error: unknown) {
        next(error);
    }
};

export const updateCourseHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedUser = getAuthenticatedUser(req);
        const courseId = parseCourseIdParam(req);
        const dto = validateUpdateCourse(req.body);

        const course = await coursesService.updateCourse(
            courseId,
            {
                id: authenticatedUser.id,
                role: authenticatedUser.role,
            },
            dto,
        );

        res.status(200).json(course);
    } catch (error: unknown) {
        next(error);
    }
};

export const deleteCourseHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authenticatedUser = getAuthenticatedUser(req);
        const courseId = parseCourseIdParam(req);

        await coursesService.deleteCourse(courseId, {
            id: authenticatedUser.id,
            role: authenticatedUser.role,
        });

        res.status(204).send();
    } catch (error: unknown) {
        next(error);
    }
};
