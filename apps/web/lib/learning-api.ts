// Lớp gọi API riêng cho Learning — đặt cạnh nhau để dễ thay đổi shape.

import { api } from './api-client';
import type {
  CompleteLessonResult,
  CourseSummary,
  CourseTree,
  LessonDetail,
} from './learning-types';

export const learningApi = {
  listCourses: () => api.get<CourseSummary[]>('/courses'),
  getCourse: (id: string) => api.get<CourseTree>(`/courses/${id}`),
  getLesson: (id: string) => api.get<LessonDetail>(`/lessons/${id}`),
  completeLesson: (id: string) =>
    api.post<CompleteLessonResult>(`/lessons/${id}/complete`),
};
