export type CourseThumbnailKey =
  | 'js'
  | 'ts'
  | 'vue'
  | 'react'
  | 'node'
  | 'security'
  | 'linux'
  | 'photography'
  | 'languages'
  | 'design'
  | 'data'
  | 'business';

export type CourseThumbnailDefinition = {
  key: CourseThumbnailKey;
  label: string;
};

export const COURSE_THUMBNAILS: ReadonlyArray<CourseThumbnailDefinition> = [
  { key: 'js', label: 'JavaScript' },
  { key: 'ts', label: 'TypeScript' },
  { key: 'vue', label: 'Vue' },
  { key: 'react', label: 'React' },
  { key: 'node', label: 'Node.js' },
  { key: 'security', label: 'Security' },
  { key: 'linux', label: 'Linux' },
  { key: 'languages', label: 'Languages' },
  { key: 'design', label: 'Design' },
  { key: 'data', label: 'Data' },
  { key: 'business', label: 'Business' },
];

export const getCourseThumbnailSrc = (thumbnailKey: CourseThumbnailKey): string =>
  `/assets/course-thumbs/${thumbnailKey}.webp`;

