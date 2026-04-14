export type StudentCourseDTO = {
    id: string;
    title: string;
    description: string | null;

    lessonsCount: number;
    completedLessonsCount: number;
    totalDurationMinutes: number;
};

export type StudentLessonDTO = {
    id: string;
    courseId: string;
    title: string;
    orderIndex: number;

    content: string | null;

    durationMinutes: number | null;
    videoUrl: string | null;
    hasPdf: boolean;

    completed: boolean;
};

export type UpdateLessonCompletionRequestDTO = {
    completed: boolean;
};

export type UpdateLessonCompletionResponseDTO = {
    lessonId: string;
    completed: boolean;
    completedLessonsCount: number;
};
