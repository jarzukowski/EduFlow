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


export type LessonCreatePayload = {
  title: string;
  content: string;
  orderIndex?: number;
  durationMinutes?: number | null;
  videoUrl?: string | null;
};

export type LessonUpdatePayload = {
  title?: string;
  content?: string;
  orderIndex?: number;
  durationMinutes?: number | null;
  videoUrl?: string | null;
};
