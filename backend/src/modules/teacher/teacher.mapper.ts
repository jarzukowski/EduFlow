import type {
    Course,
    CourseEnrollment,
    Lesson,
    User,
} from '../../../generated/client';

import type {
    CourseEnrollmentListItemDTO,
    StudentSuggestDTO,
    TeacherCourseSummaryDTO,
    TeacherLessonDTO,
} from './teacher.types';

import { maskEmail } from './teacher.utils';

type CourseWithCounts = Course & {
    _count: {
        lessons: number;
        enrollments: number;
    };
};

type EnrollmentWithStudent = CourseEnrollment & {
    student: Pick<User, 'id' | 'email' | 'username'>;
};

export const mapCourseToTeacherCourseSummaryDTO = (
    courseRecord: CourseWithCounts,
    totalDurationMinutes: number,
): TeacherCourseSummaryDTO => ({
    id: courseRecord.id,
    title: courseRecord.title,
    description: courseRecord.description ?? '',
    studentsCount: courseRecord._count.enrollments,
    lessonsCount: courseRecord._count.lessons,
    totalDurationMinutes,
});

export const mapLessonToTeacherLessonDTO = (
    lessonRecord: Lesson,
): TeacherLessonDTO => ({
    id: lessonRecord.id,
    courseId: lessonRecord.courseId,
    title: lessonRecord.title,
    content: lessonRecord.content,
    orderIndex: lessonRecord.orderIndex,
    durationMinutes: lessonRecord.durationMinutes ?? null,
    videoUrl: lessonRecord.videoUrl ?? null,
    hasPdf: Boolean(lessonRecord.pdfKey),
});

export const mapUserToStudentSuggestDTO = (
    userRecord: Pick<User, 'id' | 'email' | 'username'>,
): StudentSuggestDTO => ({
    userId: userRecord.id,
    emailMasked: maskEmail(userRecord.email),
    displayName: userRecord.username ?? undefined,
});

export const mapEnrollmentToCourseEnrollmentListItemDTO = (
    enrollmentRecord: EnrollmentWithStudent,
): CourseEnrollmentListItemDTO => ({
    studentId: enrollmentRecord.student.id,
    emailMasked: maskEmail(enrollmentRecord.student.email),
    displayName: enrollmentRecord.student.username ?? '',
    enrolledAt: enrollmentRecord.createdAt.toISOString(),
});
