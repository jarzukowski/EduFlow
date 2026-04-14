import type { Prisma } from '../../../generated/client';

import { db } from '../../db/client';
import { AppError } from '../../common/errors/AppError';

import { mapCourseToDTO, mapCoursesToDTO } from './courses.mapper';

import type {
    CourseAccessUser,
    CourseDTO,
    CreateCourseDto,
    GetCoursesQueryDTO,
    PaginatedDTO,
    UpdateCourseDto,
} from './courses.types';

class CoursesService {
    private canModifyCourse = (
        user: CourseAccessUser,
        ownerId: string,
    ): boolean =>
        user.role === 'ADMIN' || (user.role === 'TEACHER' && user.id === ownerId);

    private getSearchWhere = (search?: string): Prisma.CourseWhereInput => {
        if (!search) {
            return {};
        }

        return {
            OR: [
                {
                    title: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    description: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
            ],
        };
    };

    private getCourseOrThrow = async (courseId: string) => {
        const course = await db.course.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            throw new AppError('NOT_FOUND', 404, 'Course not found');
        }

        return course;
    };

    private assertCanModifyCourse = (
        user: CourseAccessUser,
        ownerId: string,
    ): void => {
        if (!this.canModifyCourse(user, ownerId)) {
            throw new AppError(
                'FORBIDDEN',
                403,
                'You are not allowed to modify this course',
            );
        }
    };

    getCoursesPaginated = async (
        query: GetCoursesQueryDTO,
    ): Promise<PaginatedDTO<CourseDTO>> => {
        const { page, limit, search } = query;

        const where = this.getSearchWhere(search);
        const skip = (page - 1) * limit;

        const [courses, total] = await db.$transaction([
            db.course.findMany({
                where,
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                skip,
                take: limit,
            }),
            db.course.count({ where }),
        ]);

        return {
            items: mapCoursesToDTO(courses),
            total,
            page,
            limit,
        };
    };

    getCourseById = async (courseId: string): Promise<CourseDTO> => {
        const course = await this.getCourseOrThrow(courseId);
        return mapCourseToDTO(course);
    };

    createCourse = async (
        ownerId: string,
        data: CreateCourseDto,
    ): Promise<CourseDTO> => {
        const createdCourse = await db.course.create({
            data: {
                title: data.title,
                description: data.description,
                ownerId,
                thumbnailKey: data.thumbnailKey ?? null,
            },
        });

        return mapCourseToDTO(createdCourse);
    };

    updateCourse = async (
        courseId: string,
        user: CourseAccessUser,
        data: UpdateCourseDto,
    ): Promise<CourseDTO> => {
        const existingCourse = await this.getCourseOrThrow(courseId);

        this.assertCanModifyCourse(user, existingCourse.ownerId);

        const updatedCourse = await db.course.update({
            where: { id: courseId },
            data: {
                ...(data.title !== undefined ? { title: data.title } : {}),
                ...(data.description !== undefined
                    ? { description: data.description }
                    : {}),
                ...(data.thumbnailKey !== undefined
                    ? { thumbnailKey: data.thumbnailKey }
                    : {}),
            },
        });

        return mapCourseToDTO(updatedCourse);
    };

    deleteCourse = async (
        courseId: string,
        user: CourseAccessUser,
    ): Promise<void> => {
        const existingCourse = await this.getCourseOrThrow(courseId);

        this.assertCanModifyCourse(user, existingCourse.ownerId);

        await db.course.delete({
            where: { id: courseId },
        });
    };
}

export const coursesService = new CoursesService();