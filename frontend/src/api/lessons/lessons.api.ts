import { apiClient } from '@/api/axios';

export const getLessonPdfBlob = async (
  lessonId: string,
  signal?: AbortSignal,
): Promise<Blob> => {
  const response = await apiClient.get<Blob>(`/lessons/${lessonId}/pdf`, {
    responseType: 'blob',
    signal,
  });

  return response.data;
};
