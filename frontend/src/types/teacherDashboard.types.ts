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

export type TeacherOverview = {
  coursesCount: number;
  lessonsCount: number;
  studentsCount: number;
  totalDurationMinutes: number;
};

export type StudentSuggestDTO = {
  userId: string;
  emailMasked: string;
  displayName?: string;
};

export type CourseEnrollmentListItemDTO = {
  studentId: string;
  emailMasked: string;
  displayName: string;
  enrolledAt: string;
};

export type PaginatedDTO<TItem> = {
  items: TItem[];
  total: number;
  page: number;
  limit: number;
};

export type GetCourseEnrollmentsResponseDTO =
  PaginatedDTO<CourseEnrollmentListItemDTO>;

export type UnenrollStudentResponseDTO = {
  studentsCount: number;
  removedStudentId: string;
};

export type EnrollStudentResponseDTO = {
  studentsCount: number;
  enrollment: CourseEnrollmentListItemDTO;
};


export type TeacherEnrollmentsMeta = {
  total: number;
  page: number;
  limit: number;
};

export type TeacherCourseDetailsHeader = {
  id: string;
  title: string;
  description: string;
};
