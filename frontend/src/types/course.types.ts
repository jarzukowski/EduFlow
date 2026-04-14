import type {CourseThumbnailKey} from "@/components/courses/courseThumbnails.ts";

export interface CourseDTO {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCoursePayload {
  title: string;
  description?: string;
  thumbnailKey?: CourseThumbnailKey | null;
}

export interface UpdateCoursePayload {
  title?: string;
  description?: string | null;
  thumbnailKey?: CourseThumbnailKey | null;
}

export type CourseFormValues = {
  title: string;
  description: string;
  thumbnailKey: CourseThumbnailKey | null;
};

export type CourseFormInitialValues = Partial<CourseFormValues>;
