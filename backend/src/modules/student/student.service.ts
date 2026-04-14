import { AppError } from '../../common/errors/AppError';
import { db } from '../../db/client';
import { notificationsService } from '../notifications/notifications.service';

import {
    mapCourseToStudentCourseDTO,
    mapLessonToStudentLessonDTO,
} from './student.mapper';

import type {
    StudentCourseDTO,
    StudentLessonDTO,
    UpdateLessonCompletionResponseDTO,
} from './student.types';

type CourseCompletionNotificationContext = {
    courseTitle: string;
    studentEmail: string | null;
};

export class StudentService {
    private requireEnrolledCourseOrThrow = async (
        studentId: string,
        courseId: string,
    ): Promise<void> => {
        const enrollment = await db.courseEnrollment.findUnique({
            where: {
                courseId_studentId: {
                    courseId,
                    studentId,
                },
            },
            select: { id: true },
        });

        if (!enrollment) {
            throw new AppError('NOT_FOUND', 404, 'Course not found');
        }
    };

    private requireLessonOrThrow = async (
        lessonId: string,
    ): Promise<{ id: string; courseId: string }> => {
        const lesson = await db.lesson.findUnique({
            where: { id: lessonId },
            select: {
                id: true,
                courseId: true,
            },
        });

        if (!lesson) {
            throw new AppError('NOT_FOUND', 404, 'Lesson not found');
        }

        return lesson;
    };

    private getCourseCompletionNotificationContext = async (
        studentId: string,
        courseId: string,
    ): Promise<CourseCompletionNotificationContext> => {
        const [course, student] = await Promise.all([
            db.course.findUnique({
                where: { id: courseId },
                select: {
                    title: true,
                },
            }),
            db.user.findUnique({
                where: { id: studentId },
                select: {
                    email: true,
                },
            }),
        ]);

        return {
            courseTitle: course?.title ?? 'Course',
            studentEmail: student?.email ?? null,
        };
    };

    private createCourseCompletedNotificationIfNeeded = async (
        studentId: string,
        courseId: string,
    ): Promise<void> => {
        const existingNotification = await db.notification.findFirst({
            where: {
                userId: studentId,
                type: 'COURSE_COMPLETED',
                payload: {
                    path: ['courseId'],
                    equals: courseId,
                },
            },
            select: { id: true },
        });

        if (existingNotification) {
            return;
        }

        const notificationContext = await this.getCourseCompletionNotificationContext(
            studentId,
            courseId,
        );

        await notificationsService.createForUser(studentId, 'COURSE_COMPLETED', {
            courseId,
            courseTitle: notificationContext.courseTitle,
            byUserId: studentId,
            byEmail: notificationContext.studentEmail ?? undefined,
        });
    };

    getStudentCourses = async (studentId: string): Promise<StudentCourseDTO[]> => {
        const enrollments = await db.courseEnrollment.findMany({
            where: { studentId },
            orderBy: { createdAt: 'desc' },
            select: {
                course: {
                    include: {
                        _count: {
                            select: { lessons: true },
                        },
                    },
                },
            },
        });

        const enrolledCourses = enrollments.map((enrollment) => enrollment.course);
        const courseIds = enrolledCourses.map((course) => course.id);

        if (courseIds.length === 0) {
            return [];
        }

        const [durationAggregates, lessonCompletions] = await db.$transaction([
            db.lesson.groupBy({
                by: ['courseId'],
                where: {
                    courseId: {
                        in: courseIds,
                    },
                },
                _sum: {
                    durationMinutes: true,
                },
                orderBy: {
                    courseId: 'asc',
                },
            }),
            db.lessonCompletion.findMany({
                where: {
                    studentId,
                    lesson: {
                        courseId: {
                            in: courseIds,
                        },
                    },
                },
                select: {
                    lesson: {
                        select: {
                            courseId: true,
                        },
                    },
                },
            }),
        ]);

        const totalDurationMinutesByCourseId = new Map<string, number>();

        durationAggregates.forEach((durationAggregate) => {
            totalDurationMinutesByCourseId.set(
                durationAggregate.courseId,
                durationAggregate._sum?.durationMinutes ?? 0,
            );
        });

        const completedLessonsCountByCourseId = new Map<string, number>();

        lessonCompletions.forEach((lessonCompletion) => {
            const courseId = lessonCompletion.lesson.courseId;
            const currentCompletedLessonsCount =
                completedLessonsCountByCourseId.get(courseId) ?? 0;

            completedLessonsCountByCourseId.set(
                courseId,
                currentCompletedLessonsCount + 1,
            );
        });

        return enrolledCourses.map((enrolledCourse) => {
            const completedLessonsCount =
                completedLessonsCountByCourseId.get(enrolledCourse.id) ?? 0;

            const totalDurationMinutes =
                totalDurationMinutesByCourseId.get(enrolledCourse.id) ?? 0;

            return mapCourseToStudentCourseDTO(enrolledCourse, {
                completedLessonsCount,
                totalDurationMinutes,
            });
        });
    };

    getStudentLessonsForCourse = async (
        studentId: string,
        courseId: string,
    ): Promise<StudentLessonDTO[]> => {
        await this.requireEnrolledCourseOrThrow(studentId, courseId);

        const lessons = await db.lesson.findMany({
            where: { courseId },
            orderBy: {
                orderIndex: 'asc',
            },
        });

        if (lessons.length === 0) {
            return [];
        }

        const lessonCompletions = await db.lessonCompletion.findMany({
            where: {
                studentId,
                lessonId: {
                    in: lessons.map((lesson) => lesson.id),
                },
            },
            select: {
                lessonId: true,
            },
        });

        const completedLessonIds = new Set(
            lessonCompletions.map((lessonCompletion) => lessonCompletion.lessonId),
        );

        return lessons.map((lesson) =>
            mapLessonToStudentLessonDTO(lesson, {
                completed: completedLessonIds.has(lesson.id),
            }),
        );
    };

    updateLessonCompletion = async (
        studentId: string,
        lessonId: string,
        completed: boolean,
    ): Promise<UpdateLessonCompletionResponseDTO> => {
        const lesson = await this.requireLessonOrThrow(lessonId);

        await this.requireEnrolledCourseOrThrow(studentId, lesson.courseId);

        const completionResult = await db.$transaction(async (transactionClient) => {
            if (completed) {
                await transactionClient.lessonCompletion.upsert({
                    where: {
                        studentId_lessonId: {
                            studentId,
                            lessonId,
                        },
                    },
                    update: {
                        completedAt: new Date(),
                    },
                    create: {
                        studentId,
                        lessonId,
                    },
                });
            } else {
                await transactionClient.lessonCompletion.deleteMany({
                    where: {
                        studentId,
                        lessonId,
                    },
                });
            }

            const [completedLessonsCount, totalLessonsCount] = await Promise.all([
                transactionClient.lessonCompletion.count({
                    where: {
                        studentId,
                        lesson: {
                            courseId: lesson.courseId,
                        },
                    },
                }),
                transactionClient.lesson.count({
                    where: {
                        courseId: lesson.courseId,
                    },
                }),
            ]);

            return {
                completedLessonsCount,
                totalLessonsCount,
            };
        });

        const isCourseCompletedNow =
            completed &&
            completionResult.totalLessonsCount > 0 &&
            completionResult.completedLessonsCount === completionResult.totalLessonsCount;

        if (isCourseCompletedNow) {
            await this.createCourseCompletedNotificationIfNeeded(
                studentId,
                lesson.courseId,
            );
        }

        return {
            lessonId,
            completed,
            completedLessonsCount: completionResult.completedLessonsCount,
        };
    };
}

export const studentService = new StudentService();
