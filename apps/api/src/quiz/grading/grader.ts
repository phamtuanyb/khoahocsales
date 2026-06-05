import { Question, QuestionType } from '@prisma/client';
import type { AiGradingResult } from '../../ai/openai.service';

export interface PerQuestionResult {
  questionId: string;
  type: QuestionType;
  correct: boolean;
  // Điểm 0..1 — hỗ trợ chấm 1 phần (VD tình huống partial credit).
  points: number;
  yourAnswer: unknown;
  correctAnswer: unknown;
  explanation: string | null;
  // Có khi câu hỏi tình huống/Boss Battle được AI chấm chi tiết.
  aiBreakdown?: AiGradingResult;
}

// Chấm 1 câu hỏi dựa trên type — tự động cho MC + MINI_GAME,
// chấm theo keyword cho SITUATION (placeholder trước khi AI thật).
export function gradeQuestion(question: Question, answer: unknown): PerQuestionResult {
  switch (question.type) {
    case QuestionType.MULTIPLE_CHOICE:
      return gradeMultipleChoice(question, answer);
    case QuestionType.MINI_GAME:
      return gradeMiniGame(question, answer);
    case QuestionType.SITUATION:
    case QuestionType.BOSS_BATTLE:
      return gradeSituation(question, answer);
    default:
      return {
        questionId: question.id,
        type: question.type,
        correct: false,
        points: 0,
        yourAnswer: answer,
        correctAnswer: null,
        explanation: 'Loại câu hỏi chưa được hỗ trợ',
      };
  }
}

function gradeMultipleChoice(question: Question, answer: unknown): PerQuestionResult {
  const selected = readField(answer, 'selected');
  const correct = readField(question.answer, 'correct');
  const isCorrect =
    selected !== undefined && selected !== null && String(selected) === String(correct);
  return {
    questionId: question.id,
    type: question.type,
    correct: isCorrect,
    points: isCorrect ? 1 : 0,
    yourAnswer: { selected: selected ?? null },
    correctAnswer: { correct },
    explanation: isCorrect ? 'Chính xác!' : `Đáp án đúng là ${String(correct)}`,
  };
}

function gradeMiniGame(question: Question, answer: unknown): PerQuestionResult {
  const submitted = readArrayField(answer, 'order');
  const expected = readArrayField(question.answer, 'correctOrder');
  const isCorrect = arraysEqual(submitted, expected);
  return {
    questionId: question.id,
    type: question.type,
    correct: isCorrect,
    points: isCorrect ? 1 : 0,
    yourAnswer: { order: submitted },
    correctAnswer: { order: expected },
    explanation: isCorrect
      ? 'Sắp xếp đúng thứ tự!'
      : 'Thứ tự chưa đúng — xem lại đáp án bên cạnh.',
  };
}

// Chấm tình huống theo keyword. Quá đơn giản nhưng đủ cho MVP —
// Sprint 5 sẽ thay bằng AI thật (OpenAI) theo rubric thái độ/logic/SOP.
function gradeSituation(question: Question, answer: unknown): PerQuestionResult {
  const text = String(readField(answer, 'text') ?? '').toLowerCase();
  const keywords = readArrayField(question.answer, 'keywords');
  const minScore = Number(readField(question.answer, 'minScore') ?? 50);

  if (keywords.length === 0) {
    // Chưa cấu hình keyword → tạm: có câu trả lời đủ dài là 0.5 điểm.
    const hasText = text.trim().length >= 20;
    return {
      questionId: question.id,
      type: question.type,
      correct: hasText,
      points: hasText ? 0.5 : 0,
      yourAnswer: { text },
      correctAnswer: { rubric: 'Sẽ được AI chấm chi tiết ở giai đoạn sau' },
      explanation: hasText
        ? 'Đã ghi nhận câu trả lời — chấm tạm 50%.'
        : 'Câu trả lời quá ngắn (cần ≥ 20 ký tự).',
    };
  }

  const lowerKeywords = keywords.map((k) => k.toLowerCase());
  const matched = lowerKeywords.filter((kw) => text.includes(kw));
  const ratio = matched.length / keywords.length;
  const percent = ratio * 100;
  const correct = percent >= minScore;

  return {
    questionId: question.id,
    type: question.type,
    correct,
    points: ratio,
    yourAnswer: { text },
    correctAnswer: { keywords, minScore },
    explanation: `Phát hiện ${matched.length}/${keywords.length} từ khóa cốt lõi (${Math.round(percent)}%). Ngưỡng đỗ ${minScore}%.`,
  };
}

// ---------- helpers ----------

function readField(obj: unknown, key: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  return (obj as Record<string, unknown>)[key];
}

function readArrayField(obj: unknown, key: string): string[] {
  const v = readField(obj, key);
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x));
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}
