import type { Lesson } from '../../../generated/client';
import type { LessonDTO, PublicLessonDTO } from './lessons.types';

export const mapLessonToPublicDTO = (lessonRecord: Lesson): PublicLessonDTO => ({
    id: lessonRecord.id,
    courseId: lessonRecord.courseId,
    title: lessonRecord.title,
    content: lessonRecord.content,
    orderIndex: lessonRecord.orderIndex,
    durationMinutes: lessonRecord.durationMinutes ?? null,
    createdAt: lessonRecord.createdAt.toISOString(),
    updatedAt: lessonRecord.updatedAt.toISOString(),
});

export const mapLessonsToPublicDTO = (lessonRecords: Lesson[]): PublicLessonDTO[] =>
    lessonRecords.map(mapLessonToPublicDTO);

export const mapLessonToDTO = (lessonRecord: Lesson): LessonDTO => ({
    id: lessonRecord.id,
    courseId: lessonRecord.courseId,
    title: lessonRecord.title,
    content: lessonRecord.content,
    orderIndex: lessonRecord.orderIndex,
    durationMinutes: lessonRecord.durationMinutes ?? null,
    videoUrl: lessonRecord.videoUrl ?? null,
    hasPdf: Boolean(lessonRecord.pdfKey),
    createdAt: lessonRecord.createdAt.toISOString(),
    updatedAt: lessonRecord.updatedAt.toISOString(),
});

export const mapLessonsToDTO = (lessonRecords: Lesson[]): LessonDTO[] =>
    lessonRecords.map(mapLessonToDTO);
