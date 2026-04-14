import type { Course } from '../../../generated/client';

import { COURSE_THUMBNAIL_KEY_SET } from './courses.constants';

import type { CourseDTO } from './courses.types';

const normalizeThumbnailKey = (value: string | null): string | null => {
    if (!value) return null;

    const normalizedThumbnailKey = value.trim().toLowerCase();
    return normalizedThumbnailKey.length ? normalizedThumbnailKey : null;
};

const buildThumbnailUrl = (thumbnailKey: string | null): string | null => {
    const normalizedThumbnailKey = normalizeThumbnailKey(thumbnailKey);

    if (!normalizedThumbnailKey) {
        return null;
    }

    if (!COURSE_THUMBNAIL_KEY_SET.has(normalizedThumbnailKey)) {
        return null;
    }

    return `/assets/course-thumbs/${normalizedThumbnailKey}.webp`;
};

export const mapCourseToDTO = (course: Course): CourseDTO => ({
    id: course.id,
    title: course.title,
    description: course.description ?? '',
    ownerId: course.ownerId,
    thumbnailUrl: buildThumbnailUrl(course.thumbnailKey),
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
});

export const mapCoursesToDTO = (courses: Course[]): CourseDTO[] =>
    courses.map(mapCourseToDTO);
