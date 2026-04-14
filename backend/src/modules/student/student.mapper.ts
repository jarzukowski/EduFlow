import type { Course, Lesson } from '../../../generated/client';
import type { StudentCourseDTO, StudentLessonDTO } from './student.types';

type CourseWithCounts = Course & { _count: { lessons: number } };

export const mapCourseToStudentCourseDTO = (
    courseRecord: CourseWithCounts,
    aggregates: {
        completedLessonsCount: number;
        totalDurationMinutes: number;
    },
): StudentCourseDTO => ({
    id: courseRecord.id,
    title: courseRecord.title,
    description: courseRecord.description ?? '',
    lessonsCount: courseRecord._count.lessons,
    completedLessonsCount: aggregates.completedLessonsCount,
    totalDurationMinutes: aggregates.totalDurationMinutes,
});

export const mapLessonToStudentLessonDTO = (
    lessonRecord: Lesson,
    options: { completed: boolean },
): StudentLessonDTO => ({
    id: lessonRecord.id,
    courseId: lessonRecord.courseId,
    title: lessonRecord.title,
    orderIndex: lessonRecord.orderIndex,
    content: lessonRecord.content ?? null,
    durationMinutes: lessonRecord.durationMinutes ?? null,
    videoUrl: lessonRecord.videoUrl ?? null,
    hasPdf: Boolean(lessonRecord.pdfKey),
    completed: options.completed,
});
