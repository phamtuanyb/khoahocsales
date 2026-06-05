// Khớp với DTO bên backend coach.service.ts.

export interface CoachScenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  systemPrompt: string;
  initialMessage: string;
  successCriteria: string[];
  rewardExp: number;
}

export interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
  at: string;
}

export interface AiGrading {
  attitude: number;
  logic: number;
  sopCompliance: number;
  total: number;
  strengths: string[];
  improvements: string[];
  recommendedTopics: string[];
  summary: string;
}

export interface CoachSession {
  id: string;
  scenario: CoachScenario;
  transcript: CoachMessage[];
  userTurnCount: number;
  finished: boolean;
  score: number | null;
  feedback: AiGrading | null;
  createdAt: string;
  endedAt: string | null;
}

export interface CoachSessionSummary {
  id: string;
  scenarioId: string;
  scenarioName: string;
  score: number | null;
  finished: boolean;
  createdAt: string;
  endedAt: string | null;
}
