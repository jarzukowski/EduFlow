import { AppError } from '../../common/errors/AppError';
import { db } from '../../db/client';
import { notificationsService } from '../notifications/notifications.service';

import {
    mapCourseToTeacherCourseSummaryDTO,
    mapEnrollmentToCourseEnrollmentListItemDTO,
    mapLessonToTeacherLessonDTO,
    mapUserToStudentSuggestDTO,
} from './teacher.mapper';

import { maskEmail } from './teacher.utils';

import type {
    EnrollStudentResponseDTO,
    GetCourseEnrollmentsResponseDTO,
    StudentSuggestDTO,
    TeacherCourseSummaryDTO,
    TeacherLessonDTO,
    UnenrollStudentResponseDTO,
} from './teacher.types';

type TeacherOwnedCourse = {
    id: string;
    title: string;
    ownerEmail: string;
};

type StudentRecord = {
    id: string;
    email: string;
    username: string | null;
};

export class TeacherService {
    private getOwnedCourseOrThrow = async (
        teacherId: string,
        courseId: string,
    ): Promise<TeacherOwnedCourse> => {
        const courseRecord = await db.course.findFirst({
            where: {
                id: courseId,
                ownerId: teacherId,
            },
            select: {
                id: true,
                title: true,
                owner: {
                    select: {
                        email: true,
                    },
                },
            },
        });

        if (!courseRecord) {
            throw new AppError('NOT_FOUND', 404, 'Course not found');
        }

        return {
            id: courseRecord.id,
            title: courseRecord.title,
            ownerEmail: courseRecord.owner.email,
        };
    };

    private getStudentOrThrow = async (
        studentId: string,
    ): Promise<StudentRecord> => {
        const studentRecord = await db.user.findFirst({
            where: {
                id: studentId,
                role: 'STUDENT',
            },
            select: {
                id: true,
                email: true,
                username: true,
            },
        });

        if (!studentRecord) {
            throw new AppError('NOT_FOUND', 404, 'Student not found');
        }

        return studentRecord;
    };

    private ensureEnrollmentDoesNotExist = async (
        courseId: string,
        studentId: string,
    ): Promise<void> => {
        const existingEnrollment = await db.courseEnrollment.findUnique({
            where: {
                courseId_studentId: {
                    courseId,
                    studentId,
                },
            },
            select: {
                id: true,
            },
        });

        if (existingEnrollment) {
            throw new AppError('CONFLICT', 409, 'Student already enrolled');
        }
    };

    private ensureEnrollmentExistsOrThrow = async (
        courseId: string,
        studentId: string,
    ): Promise<void> => {
        const existingEnrollment = await db.courseEnrollment.findUnique({
            where: {
                courseId_studentId: {
                    courseId,
                    studentId,
                },
            },
            select: {
                id: true,
            },
        });

        if (!existingEnrollment) {
            throw new AppError('NOT_FOUND', 404, 'Enrollment not found');
        }
    };

    private buildCourseDurationMap = async (
        courseIds: string[],
    ): Promise<Map<string, number>> => {
        if (courseIds.length === 0) {
            return new Map<string, number>();
        }

        const durationAggregation = await db.lesson.groupBy({
            by: ['courseId'],
            where: {
                courseId: {
                    in: courseIds,
                },
            },
            _sum: {
                durationMinutes: true,
            },
        });

        const durationByCourseId = new Map<string, number>();

        durationAggregation.forEach((aggregationRow) => {
            durationByCourseId.set(
                aggregationRow.courseId,
                aggregationRow._sum.durationMinutes ?? 0,
            );
        });

        return durationByCourseId;
    };

    getTeacherCourses = async (
        teacherId: string,
    ): Promise<TeacherCourseSummaryDTO[]> => {
        const courseRecords = await db.course.findMany({
            where: {
                ownerId: teacherId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                _count: {
                    select: {
                        lessons: true,
                        enrollments: true,
                    },
                },
            },
        });

        const durationByCourseId = await this.buildCourseDurationMap(
            courseRecords.map((courseRecord) => courseRecord.id),
        );

        return courseRecords.map((courseRecord) =>
            mapCourseToTeacherCourseSummaryDTO(
                courseRecord,
                durationByCourseId.get(courseRecord.id) ?? 0,
            ),
        );
    };

    getTeacherLessonsForCourse = async (
        teacherId: string,
        courseId: string,
    ): Promise<TeacherLessonDTO[]> => {
        await this.getOwnedCourseOrThrow(teacherId, courseId);

        const lessonRecords = await db.lesson.findMany({
            where: {
                courseId,
            },
            orderBy: {
                orderIndex: 'asc',
            },
        });

        return lessonRecords.map(mapLessonToTeacherLessonDTO);
    };

    getCourseEnrollments = async (
        teacherId: string,
        courseId: string,
        page: number,
        limit: number,
    ): Promise<GetCourseEnrollmentsResponseDTO> => {
        await this.getOwnedCourseOrThrow(teacherId, courseId);

        const skip = (page - 1) * limit;

        const [enrollmentRecords, total] = await db.$transaction([
            db.courseEnrollment.findMany({
                where: {
                    courseId,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
                include: {
                    student: {
                        select: {
                            id: true,
                            email: true,
                            username: true,
                        },
                    },
                },
            }),
            db.courseEnrollment.count({
                where: {
                    courseId,
                },
            }),
        ]);

        return {
            items: enrollmentRecords.map(
                mapEnrollmentToCourseEnrollmentListItemDTO,
            ),
            total,
            page,
            limit,
        };
    };

    enrollStudentToCourse = async (
        teacherId: string,
        courseId: string,
        studentId: string,
    ): Promise<EnrollStudentResponseDTO> => {
        const ownedCourse = await this.getOwnedCourseOrThrow(
            teacherId,
            courseId,
        );
        await this.getStudentOrThrow(studentId);

        await this.ensureEnrollmentDoesNotExist(courseId, studentId);

        const [createdEnrollment, studentsCount] = await db.$transaction([
            db.courseEnrollment.create({
                data: {
                    courseId,
                    studentId,
                },
                include: {
                    student: {
                        select: {
                            id: true,
                            email: true,
                            username: true,
                        },
                    },
                },
            }),
            db.courseEnrollment.count({
                where: {
                    courseId,
                },
            }),
        ]);

        await notificationsService.createForUser(
            studentId,
            'ENROLLED_TO_COURSE',
            {
                courseId,
                courseTitle: ownedCourse.title,
                byUserId: teacherId,
                byEmail: ownedCourse.ownerEmail,
            },
        );

        return {
            studentsCount,
            enrollment: {
                studentId: createdEnrollment.student.id,
                emailMasked: maskEmail(createdEnrollment.student.email),
                displayName: createdEnrollment.student.username ?? '',
                enrolledAt: createdEnrollment.createdAt.toISOString(),
            },
        };
    };

    unenrollStudentFromCourse = async (
        teacherId: string,
        courseId: string,
        studentId: string,
    ): Promise<UnenrollStudentResponseDTO> => {
        const ownedCourse = await this.getOwnedCourseOrThrow(
            teacherId,
            courseId,
        );

        await this.ensureEnrollmentExistsOrThrow(courseId, studentId);

        const [, studentsCount] = await db.$transaction([
            db.courseEnrollment.delete({
                where: {
                    courseId_studentId: {
                        courseId,
                        studentId,
                    },
                },
            }),
            db.courseEnrollment.count({
                where: {
                    courseId,
                },
            }),
        ]);

        await notificationsService.createForUser(
            studentId,
            'REMOVED_FROM_COURSE',
            {
                courseId,
                courseTitle: ownedCourse.title,
                byUserId: teacherId,
                byEmail: ownedCourse.ownerEmail,
            },
        );

        return {
            studentsCount,
            removedStudentId: studentId,
        };
    };

    suggestStudents = async (query: string): Promise<StudentSuggestDTO[]> => {
        const userRecords = await db.user.findMany({
            where: {
                role: 'STUDENT',
                OR: [
                    {
                        email: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                    {
                        username: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                ],
            },
            take: 8,
            select: {
                id: true,
                email: true,
                username: true,
            },
        });

        return userRecords.map(mapUserToStudentSuggestDTO);
    };
}

export const teacherService = new TeacherService();