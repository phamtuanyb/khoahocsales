import { api } from './api-client';
import type {
  AnswerPayload,
  QuizForUser,
  QuizSubmitResult,
} from './quiz-types';

export const quizApi = {
  getQuiz: (id: string) => api.get<QuizForUser>(`/quizzes/${id}`),
  submit: (id: string, answers: Record<string, AnswerPayload>) =>
    api.post<QuizSubmitResult>(`/quizzes/${id}/submit`, { answers }),
};
