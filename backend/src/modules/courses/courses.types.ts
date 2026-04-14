import type { UserRole } from '../auth/auth.types';
import type { COURSE_THUMBNAIL_KEYS } from './courses.constants';

export type CourseThumbnailKey = (typeof COURSE_THUMBNAIL_KEYS)[number];

export interface CourseDTO {
    id: string;
    title: string;
    description: string | null;
    ownerId: string;
    thumbnailUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCourseDto {
    title: string;
    description: string;
    thumbnailKey?: CourseThumbnailKey | null;
}

export interface UpdateCourseDto {
    title?: string;
    description?: string;
    thumbnailKey?: CourseThumbnailKey | null;
}

export interface GetCoursesQueryDTO {
    page: number;
    limit: number;
    search?: string;
}

export interface PaginatedDTO<TItem> {
    items: TItem[];
    total: number;
    page: number;
    limit: number;
}

export interface CourseAccessUser {
    id: string;
    role: UserRole;
}
