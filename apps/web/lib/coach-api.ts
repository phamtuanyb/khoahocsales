import { api } from './api-client';
import type {
  CoachScenario,
  CoachSession,
  CoachSessionSummary,
} from './coach-types';

export const coachApi = {
  scenarios: () => api.get<CoachScenario[]>('/ai-coach/scenarios'),
  history: () => api.get<CoachSessionSummary[]>('/ai-coach/sessions'),
  create: (scenario: string) =>
    api.post<CoachSession>('/ai-coach/session', { scenario }),
  get: (id: string) => api.get<CoachSession>(`/ai-coach/session/${id}`),
  sendMessage: (id: string, content: string) =>
    api.post<CoachSession>(`/ai-coach/session/${id}/message`, { content }),
  finish: (id: string) => api.post<CoachSession>(`/ai-coach/session/${id}/finish`),
};
