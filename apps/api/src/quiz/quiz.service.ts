import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ExpAction,
  Prisma,
  QuestionType,
  QuizAttemptStatus,
} from '@prisma/client';
import { OpenAiService, type AiGradingResult } from '../ai/openai.service';
import {
  GamificationService,
  type LevelUpInfo,
} from '../gamification/gamification.service';
import { PrismaService } from '../prisma/prisma.service';
import { gradeQuestion, type PerQuestionResult } from './grading/grader';

// Bảng quy đổi EXP — spec mục 5.5.
const EXP_PER_CORRECT_ANSWER = 20;
const EXP_BOSS_BATTLE_PASS = 200;

@Injectable()
export class QuizService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
    private readonly openai: OpenAiService,
  ) {}

  // GET /quizzes/:id — lấy đề thi (đã sanitize: KHÔNG kèm đáp án).
  async getQuiz(userId: string, quizId: string): Promise<QuizForUserDto> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { question: true },
          orderBy: { order: 'asc' },
        },
        module: { include: { course: true } },
        level: true,
      },
    });
    if (!quiz || !quiz.isActive) {
      throw new NotFoundException('Không tìm thấy bài thi');
    }

    await this.assertLevelPrerequisite(userId, quiz.level?.order ?? null);

    const attemptsUsed = await this.prisma.quizAttempt.count({
      where: {
        userId,
        quizId,
        status: { in: [QuizAttemptStatus.PASSED, QuizAttemptStatus.FAILED] },
      },
    });

    const sanitizedQuestions = quiz.questions.map((qq, idx) => {
      const q = qq.question;
      let options = q.options as unknown;
      // Mini-game: trộn thứ tự items để mỗi lần làm bài khác nhau.
      if (
        q.type === QuestionType.MINI_GAME &&
        options &&
        Array.isArray(options)
      ) {
        options = shuffleArray([...(options as unknown[])]);
      }
      return {
        id: q.id,
        type: q.type,
        content: q.content,
        order: idx + 1,
        difficulty: q.difficulty,
        options: options ?? null,
      };
    });

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      passScore: quiz.passScore,
      timeLimitSec: quiz.timeLimitSec,
      maxAttempts: quiz.maxAttempts,
      attemptsUsed,
      remainingAttempts: Math.max(0, quiz.maxAttempts - attemptsUsed),
      isBossBattle: quiz.levelId !== null,
      levelName: quiz.level?.name ?? null,
      module: quiz.module
        ? {
            id: quiz.module.id,
            title: quiz.module.title,
            courseId: quiz.module.courseId,
            courseTitle: quiz.module.course.title,
          }
        : null,
      questions: sanitizedQuestions,
    };
  }

  // POST /quizzes/:id/submit — chấm điểm, cộng EXP, kiểm tra Level Up.
  async submitQuiz(
    userId: string,
    quizId: string,
    answers: Record<string, unknown>,
  ): Promise<QuizSubmitResult> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { question: true },
          orderBy: { order: 'asc' },
        },
        level: true,
        module: true,
      },
    });
    if (!quiz || !quiz.isActive) {
      throw new NotFoundException('Không tìm thấy bài thi');
    }

    await this.assertLevelPrerequisite(userId, quiz.level?.order ?? null);

    const attemptsUsed = await this.prisma.quizAttempt.count({
      where: {
        userId,
        quizId,
        status: { in: [QuizAttemptStatus.PASSED, QuizAttemptStatus.FAILED] },
      },
    });
    if (attemptsUsed >= quiz.maxAttempts) {
      throw new ForbiddenException('Bạn đã dùng hết số lượt làm bài thi này');
    }

    // Chấm từng câu — sync trước (MC + MINI_GAME + keyword fallback cho situation).
    const results: PerQuestionResult[] = quiz.questions.map((qq) =>
      gradeQuestion(qq.question, answers[qq.question.id]),
    );

    // Sau đó nâng cấp các câu SITUATION/BOSS_BATTLE bằng AI grading (spec 6.3).
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i]!.question;
      if (
        q.type !== QuestionType.SITUATION &&
        q.type !== QuestionType.BOSS_BATTLE
      ) {
        continue;
      }
      const answerObj = answers[q.id] as { text?: string } | undefined;
      const studentText = answerObj?.text?.trim() ?? '';
      if (studentText.length < 10) continue; // Không đủ để chấm — giữ kết quả keyword.

      const rubric = (q.answer as Record<string, unknown> | null) ?? {};
      const aiResult = await this.openai.gradeSituation(userId, {
        questionContent: q.content,
        studentAnswer: studentText,
        rubric: typeof rubric.rubric === 'string' ? rubric.rubric : undefined,
        keywords: Array.isArray(rubric.keywords)
          ? (rubric.keywords as string[])
          : undefined,
        scope: q.type === QuestionType.BOSS_BATTLE ? 'sales' : undefined,
      });

      // Ghi đè kết quả keyword bằng kết quả AI.
      results[i] = {
        questionId: q.id,
        type: q.type,
        correct: aiResult.total >= 50,
        points: aiResult.total / 100,
        yourAnswer: { text: studentText },
        correctAnswer: { rubric: 'AI chấm theo 3 tiêu chí thái độ/logic/SOP' },
        explanation: aiResult.summary,
        aiBreakdown: aiResult,
      };
    }

    const totalQuestions = quiz.questions.length;
    const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
    const score =
      totalQuestions > 0 ? Math.round((totalPoints / totalQuestions) * 100) : 0;
    const passed = score >= quiz.passScore;
    const correctCount = results.filter((r) => r.correct).length;

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        score,
        passed,
        status: passed ? QuizAttemptStatus.PASSED : QuizAttemptStatus.FAILED,
        answers: answers as Prisma.JsonObject,
        finishedAt: new Date(),
      },
    });

    // Cộng EXP theo câu đúng (mục 5.5: +20 / câu đúng).
    let totalExpAwarded = 0;
    let levelUp: LevelUpInfo | null = null;
    const newBadgesAccum: Array<{ id: string; name: string; icon: string; description: string }> = [];
    const newCertsAccum: Array<{ id: string; type: string; code: string }> = [];
    const newMissionsAccum: Array<{ missionId: string; title: string; rewardExp: number }> = [];
    let lastStreakIncreased = false;
    let lastStreakCount: number | undefined;

    const mergeCascade = (r: Awaited<ReturnType<GamificationService['addExp']>>): void => {
      totalExpAwarded += r.expAdded;
      if (r.levelUp) levelUp = r.levelUp;
      if (r.newBadges) newBadgesAccum.push(
        ...r.newBadges.map((b) => ({
          id: b.id, name: b.name, icon: b.icon, description: b.description,
        })),
      );
      if (r.newCertificates) newCertsAccum.push(
        ...r.newCertificates.map((c) => ({ id: c.id, type: c.type, code: c.code })),
      );
      if (r.newMissionsCompleted) newMissionsAccum.push(...r.newMissionsCompleted);
      if (r.streakIncreased) lastStreakIncreased = true;
      if (r.streakCount !== undefined) lastStreakCount = r.streakCount;
    };

    const expForAnswers = correctCount * EXP_PER_CORRECT_ANSWER;
    if (expForAnswers > 0) {
      mergeCascade(await this.gamification.addExp({
        userId,
        action: ExpAction.QUIZ_CORRECT_ANSWER,
        amount: expForAnswers,
        refType: 'quiz_attempt',
        refId: attempt.id,
        note: `${correctCount}/${totalQuestions} câu đúng — ${quiz.title}`,
      }));
    }

    // Bonus Boss Battle (+200 nếu đỗ bài thi Level).
    if (quiz.levelId && passed) {
      mergeCascade(await this.gamification.addExp({
        userId,
        action: ExpAction.BOSS_BATTLE_PASSED,
        amount: EXP_BOSS_BATTLE_PASS,
        refType: 'quiz_attempt',
        refId: attempt.id,
        note: `Vượt Boss Battle: ${quiz.title}`,
      }));
    }

    return {
      attemptId: attempt.id,
      score,
      passed,
      passScore: quiz.passScore,
      correctCount,
      totalQuestions,
      perQuestion: results,
      expAwarded: totalExpAwarded,
      isBossBattle: quiz.levelId !== null,
      levelUp,
      remainingAttempts: Math.max(0, quiz.maxAttempts - attemptsUsed - 1),
      newBadges: newBadgesAccum,
      newCertificates: newCertsAccum,
      newMissionsCompleted: newMissionsAccum,
      streakIncreased: lastStreakIncreased,
      streakCount: lastStreakCount,
    };
  }

  // ---------- helpers ----------

  // Mục 5.10 — chưa đỗ thi Level N-1 thì không được mở bài thi Level N.
  private async assertLevelPrerequisite(
    userId: string,
    levelOrder: number | null,
  ): Promise<void> {
    if (!levelOrder || levelOrder <= 1) return;
    const prevLevel = await this.prisma.level.findFirst({
      where: { order: levelOrder - 1 },
    });
    if (!prevLevel) return;
    const passed = await this.prisma.quizAttempt.findFirst({
      where: {
        userId,
        passed: true,
        quiz: { levelId: prevLevel.id },
      },
      select: { id: true },
    });
    if (!passed) {
      throw new ForbiddenException(
        `Bạn cần đỗ bài thi Level ${prevLevel.order} — ${prevLevel.name} trước khi mở bài thi này.`,
      );
    }
  }
}

// Trộn mảng tại chỗ (Fisher-Yates). Trả về chính mảng đầu vào để chain.
function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

// ---------- DTOs ----------

export interface QuizForUserDto {
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
  questions: QuizQuestionForUserDto[];
}

export interface QuizQuestionForUserDto {
  id: string;
  type: QuestionType;
  content: string;
  order: number;
  difficulty: string;
  options: unknown;
}

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
  levelUp: LevelUpInfo | null;
  remainingAttempts: number;
  newBadges: Array<{ id: string; name: string; icon: string; description: string }>;
  newCertificates: Array<{ id: string; type: string; code: string }>;
  newMissionsCompleted: Array<{ missionId: string; title: string; rewardExp: number }>;
  streakIncreased: boolean;
  streakCount: number | undefined;
}
