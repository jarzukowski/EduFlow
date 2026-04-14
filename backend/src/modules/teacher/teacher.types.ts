export type TeacherCourseSummaryDTO = {
    id: string;
    title: string;
    description: string;
    studentsCount: number;
    lessonsCount: number;
    totalDurationMinutes: number;
};

export type TeacherLessonDTO = {
    id: string;
    courseId: string;
    title: string;
    content: string;
    orderIndex: number;
    durationMinutes: number | null;
    videoUrl: string | null;
    hasPdf: boolean;
};

export type StudentSuggestDTO = {
    userId: string;
    emailMasked: string;
    displayName?: string;
};

export type EnrollStudentRequestDTO = {
    studentId: string;
};

export type CourseEnrollmentListItemDTO = {
    studentId: string;
    emailMasked: string;
    displayName: string;
    enrolledAt: string;
};

export type EnrollStudentResponseDTO = {
    studentsCount: number;
    enrollment: CourseEnrollmentListItemDTO;
};

export type UnenrollStudentResponseDTO = {
    studentsCount: number;
    removedStudentId: string;
};

export type PaginatedDTO<TItem> = {
    items: TItem[];
    total: number;
    page: number;
    limit: number;
};

export type GetCourseEnrollmentsResponseDTO =
    PaginatedDTO<CourseEnrollmentListItemDTO>;