import fs from 'fs';
import { constants as fsConstants } from 'fs';

import { AppError } from '../../common/errors/AppError';
import { getLessonPdfPath, saveLessonPdf } from '../../common/files/pdfStorage';
import { db } from '../../db/client';
import type { UserRole } from '../auth/auth.types';

import {
    mapLessonToDTO,
    mapLessonToPublicDTO,
    mapLessonsToPublicDTO,
} from './lessons.mapper';

import type {
    CreateLessonPayload,
    LessonDTO,
    PublicLessonDTO,
    UpdateLessonPayload,
} from './lessons.types';

type LessonAccessUser = {
    id: string;
    role: UserRole;
};

type CourseAccessRecord = {
    id: string;
    ownerId: string;
};

type LessonWithCourseOwnerRecord = {
    id: string;
    courseId: string;
    title: string;
    content: string;
    orderIndex: number;
    videoUrl: string | null;
    durationMinutes: number | null;
    pdfKey: string | null;
    course: {
        ownerId: string;
    };
};

class LessonsService {
    private canModifyCourse = (
        user: LessonAccessUser,
        courseOwnerId: string,
    ): boolean =>
        user.role === 'ADMIN' ||
        (user.role === 'TEACHER' && user.id === courseOwnerId);

    private ensureCanModifyCourseOrThrow = (
        user: LessonAccessUser,
        courseOwnerId: string,
        errorMessage: string,
    ): void => {
        if (!this.canModifyCourse(user, courseOwnerId)) {
            throw new AppError('FORBIDDEN', 403, errorMessage);
        }
    };

    private ensureCanAccessCourseContentOrThrow = async (
        user: LessonAccessUser,
        courseId: string,
        courseOwnerId: string,
    ): Promise<void> => {
        if (user.role === 'ADMIN') {
            return;
        }

        if (user.role === 'TEACHER' && user.id === courseOwnerId) {
            return;
        }

        if (user.role === 'STUDENT') {
            const enrollmentRecord = await db.courseEnrollment.findUnique({
                where: {
                    courseId_studentId: {
                        courseId,
                        studentId: user.id,
                    },
                },
                select: {
                    id: true,
                },
            });

            if (enrollmentRecord) {
                return;
            }
        }

        throw new AppError(
            'FORBIDDEN',
            403,
            'You are not allowed to access this content',
        );
    };

    private getCourseOrThrow = async (
        courseId: string,
    ): Promise<CourseAccessRecord> => {
        const courseRecord = await db.course.findUnique({
            where: {
                id: courseId,
            },
            select: {
                id: true,
                ownerId: true,
            },
        });

        if (!courseRecord) {
            throw new AppError('NOT_FOUND', 404, 'Course not found');
        }

        return courseRecord;
    };

    private getLessonWithOwnerOrThrow = async (
        lessonId: string,
    ): Promise<LessonWithCourseOwnerRecord> => {
        const lessonRecord = await db.lesson.findUnique({
            where: {
                id: lessonId,
            },
            select: {
                id: true,
                courseId: true,
                title: true,
                content: true,
                orderIndex: true,
                videoUrl: true,
                durationMinutes: true,
                pdfKey: true,
                course: {
                    select: {
                        ownerId: true,
                    },
                },
            },
        });

        if (!lessonRecord) {
            throw new AppError('NOT_FOUND', 404, 'Lesson not found');
        }

        return lessonRecord;
    };

    private deletePdfFileBestEffort = async (
        pdfKey: string | null | undefined,
    ): Promise<void> => {
        if (!pdfKey) {
            return;
        }

        try {
            const pdfPath = getLessonPdfPath(pdfKey);
            await fs.promises.unlink(pdfPath);
        } catch {
            return;
        }
    };

    private getReadablePdfPathOrThrow = async (pdfKey: string): Promise<string> => {
        const pdfPath = getLessonPdfPath(pdfKey);

        try {
            await fs.promises.access(pdfPath, fsConstants.R_OK);

            const fileStats = await fs.promises.stat(pdfPath);

            if (!fileStats.isFile()) {
                throw new AppError('NOT_FOUND', 404, 'PDF not found');
            }

            return pdfPath;
        } catch (error: unknown) {
            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError('NOT_FOUND', 404, 'PDF not found');
        }
    };

    private reorderLessonsAfterDeletion = async (
        courseId: string,
    ): Promise<void> => {
        const remainingLessonRecords = await db.lesson.findMany({
            where: {
                courseId,
            },
            orderBy: [
                {
                    orderIndex: 'asc',
                },
                {
                    id: 'asc',
                },
            ],
            select: {
                id: true,
                orderIndex: true,
            },
        });

        const updateQueries = remainingLessonRecords
            .map((lessonRecord, index) => ({
                lessonId: lessonRecord.id,
                nextOrderIndex: index + 1,
                currentOrderIndex: lessonRecord.orderIndex,
            }))
            .filter(
                (lessonRecord) =>
                    lessonRecord.currentOrderIndex !==
                    lessonRecord.nextOrderIndex,
            )
            .map((lessonRecord) =>
                db.lesson.update({
                    where: {
                        id: lessonRecord.lessonId,
                    },
                    data: {
                        orderIndex: lessonRecord.nextOrderIndex,
                    },
                }),
            );

        if (updateQueries.length > 0) {
            await db.$transaction(updateQueries);
        }
    };

    getLessonsByCourse = async (courseId: string): Promise<PublicLessonDTO[]> => {
        await this.getCourseOrThrow(courseId);

        const lessonRecords = await db.lesson.findMany({
            where: {
                courseId,
            },
            orderBy: {
                orderIndex: 'asc',
            },
        });

        return mapLessonsToPublicDTO(lessonRecords);
    };

    getLessonById = async (lessonId: string): Promise<PublicLessonDTO> => {
        const lessonRecord = await db.lesson.findUnique({
            where: {
                id: lessonId,
            },
        });

        if (!lessonRecord) {
            throw new AppError('NOT_FOUND', 404, 'Lesson not found');
        }

        return mapLessonToPublicDTO(lessonRecord);
    };

    getLessonPdfStream = async (
        lessonId: string,
        user: LessonAccessUser,
    ): Promise<{ stream: fs.ReadStream }> => {
        const lessonRecord = await this.getLessonWithOwnerOrThrow(lessonId);

        await this.ensureCanAccessCourseContentOrThrow(
            user,
            lessonRecord.courseId,
            lessonRecord.course.ownerId,
        );

        if (!lessonRecord.pdfKey) {
            throw new AppError('NOT_FOUND', 404, 'PDF not found');
        }

        const pdfPath = await this.getReadablePdfPathOrThrow(
            lessonRecord.pdfKey,
        );

        return {
            stream: fs.createReadStream(pdfPath),
        };
    };

    createLesson = async (
        courseId: string,
        user: LessonAccessUser,
        payload: CreateLessonPayload,
        pdfFile: Express.Multer.File | null,
    ): Promise<LessonDTO> => {
        const courseRecord = await this.getCourseOrThrow(courseId);

        this.ensureCanModifyCourseOrThrow(
            user,
            courseRecord.ownerId,
            'You are not allowed to add lessons to this course',
        );

        const existingLessonRecords = await db.lesson.findMany({
            where: {
                courseId,
            },
            orderBy: [
                {
                    orderIndex: 'asc',
                },
                {
                    id: 'asc',
                },
            ],
            select: {
                id: true,
                orderIndex: true,
            },
        });

        const maxInsertPosition = existingLessonRecords.length + 1;
        const requestedPosition = payload.orderIndex ?? maxInsertPosition;
        const targetOrderIndex = Math.min(
            Math.max(requestedPosition, 1),
            maxInsertPosition,
        );

        const newPdfKey = pdfFile ? await saveLessonPdf(pdfFile) : null;

        try {
            const createdLesson = await db.$transaction(async (transaction) => {
                if (targetOrderIndex <= existingLessonRecords.length) {
                    await transaction.lesson.updateMany({
                        where: {
                            courseId,
                            orderIndex: {
                                gte: targetOrderIndex,
                            },
                        },
                        data: {
                            orderIndex: {
                                increment: 1,
                            },
                        },
                    });
                }

                return transaction.lesson.create({
                    data: {
                        courseId,
                        title: payload.title,
                        content: payload.content,
                        orderIndex: targetOrderIndex,
                        durationMinutes: payload.durationMinutes ?? null,
                        videoUrl: payload.videoUrl ?? null,
                        pdfKey: newPdfKey,
                    },
                });
            });

            return mapLessonToDTO(createdLesson);
        } catch (error: unknown) {
            await this.deletePdfFileBestEffort(newPdfKey);
            throw error;
        }
    };

    updateLesson = async (
        lessonId: string,
        user: LessonAccessUser,
        payload: UpdateLessonPayload,
        pdfFile: Express.Multer.File | null,
    ): Promise<LessonDTO> => {
        const existingLesson = await this.getLessonWithOwnerOrThrow(lessonId);

        this.ensureCanModifyCourseOrThrow(
            user,
            existingLesson.course.ownerId,
            'You are not allowed to modify this lesson',
        );

        const previousPdfKey = existingLesson.pdfKey ?? null;
        const newPdfKey = pdfFile ? await saveLessonPdf(pdfFile) : null;
        const nextPdfKey = pdfFile ? newPdfKey : previousPdfKey;

        const hasOrderIndexChange =
            payload.orderIndex !== undefined &&
            payload.orderIndex !== existingLesson.orderIndex;

        const nextTitle = payload.title ?? existingLesson.title;
        const nextContent = payload.content ?? existingLesson.content;
        const nextVideoUrl =
            payload.videoUrl !== undefined
                ? payload.videoUrl
                : existingLesson.videoUrl;
        const nextDurationMinutes =
            payload.durationMinutes !== undefined
                ? payload.durationMinutes
                : existingLesson.durationMinutes;

        if (!hasOrderIndexChange) {
            try {
                const updatedLesson = await db.lesson.update({
                    where: {
                        id: lessonId,
                    },
                    data: {
                        title: nextTitle,
                        content: nextContent,
                        videoUrl: nextVideoUrl,
                        durationMinutes: nextDurationMinutes,
                        pdfKey: nextPdfKey,
                        orderIndex: existingLesson.orderIndex,
                    },
                });

                if (pdfFile && previousPdfKey && previousPdfKey !== nextPdfKey) {
                    await this.deletePdfFileBestEffort(previousPdfKey);
                }

                return mapLessonToDTO(updatedLesson);
            } catch (error: unknown) {
                await this.deletePdfFileBestEffort(newPdfKey);
                throw error;
            }
        }

        const orderedLessonRecords = await db.lesson.findMany({
            where: {
                courseId: existingLesson.courseId,
            },
            orderBy: [
                {
                    orderIndex: 'asc',
                },
                {
                    id: 'asc',
                },
            ],
            select: {
                id: true,
            },
        });

        const currentIndex = orderedLessonRecords.findIndex(
            (lessonRecord) => lessonRecord.id === lessonId,
        );

        if (currentIndex < 0) {
            await this.deletePdfFileBestEffort(newPdfKey);
            throw new AppError('NOT_FOUND', 404, 'Lesson not found');
        }

        const requestedPosition = payload.orderIndex ?? existingLesson.orderIndex;
        const clampedPosition = Math.min(
            Math.max(requestedPosition, 1),
            orderedLessonRecords.length,
        );
        const targetIndex = clampedPosition - 1;

        const reorderedLessonIds = orderedLessonRecords.map(
            (lessonRecord) => lessonRecord.id,
        );

        reorderedLessonIds.splice(currentIndex, 1);
        reorderedLessonIds.splice(targetIndex, 0, lessonId);

        try {
            const updatedTargetLesson = await db.$transaction(
                async (transaction) => {
                    for (const [index, currentLessonId] of reorderedLessonIds.entries()) {
                        await transaction.lesson.update({
                            where: {
                                id: currentLessonId,
                            },
                            data: {
                                orderIndex: index + 1,
                                ...(currentLessonId === lessonId
                                    ? {
                                        title: nextTitle,
                                        content: nextContent,
                                        videoUrl: nextVideoUrl,
                                        durationMinutes: nextDurationMinutes,
                                        pdfKey: nextPdfKey,
                                    }
                                    : {}),
                            },
                        });
                    }

                    const lessonRecord = await transaction.lesson.findUnique({
                        where: {
                            id: lessonId,
                        },
                    });

                    if (!lessonRecord) {
                        throw new AppError(
                            'INTERNAL_SERVER_ERROR',
                            500,
                            'Failed to update lesson',
                        );
                    }

                    return lessonRecord;
                },
            );

            if (pdfFile && previousPdfKey && previousPdfKey !== nextPdfKey) {
                await this.deletePdfFileBestEffort(previousPdfKey);
            }

            return mapLessonToDTO(updatedTargetLesson);
        } catch (error: unknown) {
            await this.deletePdfFileBestEffort(newPdfKey);
            throw error;
        }
    };

    deleteLesson = async (
        lessonId: string,
        user: LessonAccessUser,
    ): Promise<void> => {
        const existingLesson = await this.getLessonWithOwnerOrThrow(lessonId);

        this.ensureCanModifyCourseOrThrow(
            user,
            existingLesson.course.ownerId,
            'You are not allowed to delete this lesson',
        );

        const pdfKeyToDelete = existingLesson.pdfKey ?? null;
        const courseId = existingLesson.courseId;

        await db.lesson.delete({
            where: {
                id: lessonId,
            },
        });

        await this.deletePdfFileBestEffort(pdfKeyToDelete);
        await this.reorderLessonsAfterDeletion(courseId);
    };

    uploadLessonPdf = async (
        lessonId: string,
        user: LessonAccessUser,
        pdfFile: Express.Multer.File,
    ): Promise<LessonDTO> => {
        const existingLesson = await this.getLessonWithOwnerOrThrow(lessonId);

        this.ensureCanModifyCourseOrThrow(
            user,
            existingLesson.course.ownerId,
            'You are not allowed to upload pdf for this lesson',
        );

        const previousPdfKey = existingLesson.pdfKey ?? null;
        const newPdfKey = await saveLessonPdf(pdfFile);

        try {
            const updatedLesson = await db.lesson.update({
                where: {
                    id: lessonId,
                },
                data: {
                    pdfKey: newPdfKey,
                },
            });

            if (previousPdfKey && previousPdfKey !== newPdfKey) {
                await this.deletePdfFileBestEffort(previousPdfKey);
            }

            return mapLessonToDTO(updatedLesson);
        } catch (error: unknown) {
            await this.deletePdfFileBestEffort(newPdfKey);
            throw error;
        }
    };

    deleteLessonPdf = async (
        lessonId: string,
        user: LessonAccessUser,
    ): Promise<void> => {
        const existingLesson = await this.getLessonWithOwnerOrThrow(lessonId);

        this.ensureCanModifyCourseOrThrow(
            user,
            existingLesson.course.ownerId,
            'You are not allowed to delete pdf for this lesson',
        );

        if (!existingLesson.pdfKey) {
            return;
        }

        const pdfKeyToDelete = existingLesson.pdfKey;

        await db.lesson.update({
            where: {
                id: lessonId,
            },
            data: {
                pdfKey: null,
            },
        });

        await this.deletePdfFileBestEffort(pdfKeyToDelete);
    };
}

export const lessonsService = new LessonsService();
