import type { QuestionDifficulty, QuestionType } from '@mkt-academy/types';

// Khớp với DTO bên backend (quiz.service.ts).

export interface QuizForUser {
  id: string;
  title: string;
  description: string | null;
  passScore: number;
  timeLimitSec: number;
  maxAttempts: number;
  attemptsUsed: number;
  remainingAttempts: number;
  isBossBattle: boolean;
  levelName: string | null;
  module: {
    id: string;
    title: string;
    courseId: string;
    courseTitle: string;
  } | null;
  questions: QuizQuestionForUser[];
}

export interface QuizQuestionForUser {
  id: string;
  type: QuestionType;
  content: string;
  order: number;
  difficulty: QuestionDifficulty;
  options: unknown;
}

// Cấu trúc options khác nhau theo type.
export interface MultipleChoiceOption {
  key: string;
  text: string;
}
export interface MiniGameItem {
  id: string;
  text: string;
}

// Answer payload gửi lên server (key = questionId).
export type AnswerPayload =
  | { type: 'MULTIPLE_CHOICE'; selected: string }
  | { type: 'SITUATION'; text: string }
  | { type: 'MINI_GAME'; order: string[] };

export interface QuizSubmitResult {
  attemptId: string;
  score: number;
  passed: boolean;
  passScore: number;
  correctCount: number;
  totalQuestions: number;
  perQuestion: PerQuestionResult[];
  expAwarded: number;
  isBossBattle: boolean;
  levelUp: LevelUpData | null;
  remainingAttempts: number;
}

export interface PerQuestionResult {
  questionId: string;
  type: QuestionType;
  correct: boolean;
  points: number;
  yourAnswer: unknown;
  correctAnswer: unknown;
  explanation: string | null;
  // Có khi câu tình huống/Boss Battle được AI chấm — kèm chi tiết theo 3 tiêu chí.
  aiBreakdown?: {
    attitude: number;
    logic: number;
    sopCompliance: number;
    total: number;
    strengths: string[];
    improvements: string[];
    recommendedTopics: string[];
    summary: string;
  };
}

export interface LevelUpData {
  fromLevel: { id: string; order: number; name: string };
  toLevel: { id: string; order: number; name: string; expThreshold: number };
}
