export type PublicLessonDTO = {
    id: string;
    courseId: string;
    title: string;
    content: string;
    orderIndex: number;
    durationMinutes: number | null;
    createdAt: string;
    updatedAt: string;
};

export type LessonDTO = {
    id: string;
    courseId: string;
    title: string;
    content: string;
    orderIndex: number;
    durationMinutes: number | null;
    videoUrl: string | null;
    hasPdf: boolean;
    createdAt: string;
    updatedAt: string;
};

export type CreateLessonPayload = {
    title: string;
    content: string;
    orderIndex?: number;
    durationMinutes?: number | null;
    videoUrl?: string | null;
};

export type UpdateLessonPayload = {
    title?: string;
    content?: string;
    orderIndex?: number;
    durationMinutes?: number | null;
    videoUrl?: string | null;
};
