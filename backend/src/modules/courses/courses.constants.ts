export const COURSE_TITLE_MIN_LENGTH = 3;
export const COURSE_TITLE_MAX_LENGTH = 90;

export const COURSE_DESCRIPTION_MIN_LENGTH = 10;
export const COURSE_DESCRIPTION_MAX_LENGTH = 2000;

export const COURSE_DEFAULT_LIMIT = 12;
export const COURSE_MAX_LIMIT = 50;

export const COURSE_THUMBNAIL_KEYS = [
    'js',
    'ts',
    'vue',
    'react',
    'node',
    'security',
    'linux',
    'photography',
    'languages',
    'design',
    'data',
    'business',
] as const;

export const COURSE_THUMBNAIL_KEY_SET = new Set<string>(COURSE_THUMBNAIL_KEYS);
