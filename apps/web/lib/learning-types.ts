import type { LessonStatus } from '@mkt-academy/types';
import type { LevelUpData } from './quiz-types';

// Khớp với DTO bên backend (learning.service.ts).
export interface CourseSummary {
  id: string;
  title: string;
  description: string | null;
  order: number;
  department: { id: string; name: string };
  moduleCount: number;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

export interface CourseTree {
  id: string;
  title: string;
  description: string | null;
  department: { id: string; name: string };
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  modules: ModuleTree[];
}

export interface ModuleTree {
  id: string;
  title: string;
  description: string | null;
  order: number;
  locked: boolean;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  lessons: LessonSummary[];
  quiz: ModuleQuizInfo | null;
}

export interface ModuleQuizInfo {
  id: string;
  title: string;
  passScore: number;
  timeLimitSec: number;
  maxAttempts: number;
  attemptsUsed: number;
  bestScore: number | null;
  passed: boolean;
  locked: boolean;
}

export interface LessonSummary {
  id: string;
  title: string;
  order: number;
  hasVideo: boolean;
  status: LessonStatus;
}

export interface LessonDetail {
  id: string;
  title: string;
  content: string;
  videoUrl: string | null;
  order: number;
  module: {
    id: string;
    title: string;
    order: number;
    courseId: string;
    courseTitle: string;
  };
  navigation: {
    prevLessonId: string | null;
    nextLessonId: string | null;
  };
  progress: {
    status: LessonStatus;
    completedAt: string | null;
  };
}

export interface CompleteLessonResult {
  lesson: { id: string; status: LessonStatus; completedAt: string | null };
  module: {
    id: string;
    completedLessons: number;
    totalLessons: number;
    progressPercent: number;
    moduleCompleted: boolean;
  };
  expAwarded: number;
  wasAlreadyCompleted: boolean;
  levelUp: LevelUpData | null;
}
