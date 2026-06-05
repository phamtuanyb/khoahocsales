import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, QuestionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateQuestionDto,
  CreateQuizDto,
  UpdateQuestionDto,
  UpdateQuizDto,
} from './dto/question.dto';

@Injectable()
export class AdminQuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== Questions =====
  listQuestions(filter: { type?: string; moduleId?: string; q?: string }) {
    const where: Prisma.QuestionWhereInput = {};
    if (filter.type) where.type = filter.type as QuestionType;
    if (filter.moduleId) where.moduleId = filter.moduleId;
    if (filter.q) where.content = { contains: filter.q, mode: 'insensitive' };
    return this.prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { module: { select: { id: true, title: true, courseId: true } } },
      take: 200,
    });
  }

  async getQuestion(id: string) {
    const q = await this.prisma.question.findUnique({
      where: { id },
      include: { module: { include: { course: true } } },
    });
    if (!q) throw new NotFoundException('Không tìm thấy câu hỏi');
    return q;
  }

  async createQuestion(dto: CreateQuestionDto) {
    this.validateQuestionStructure(dto.type, dto.options, dto.answer);
    return this.prisma.question.create({
      data: {
        type: dto.type,
        content: dto.content,
        options: (dto.options ?? null) as Prisma.InputJsonValue,
        answer: dto.answer as Prisma.InputJsonValue,
        difficulty: dto.difficulty ?? 'MEDIUM',
        moduleId: dto.moduleId ?? null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateQuestion(id: string, dto: UpdateQuestionDto) {
    const existing = await this.getQuestion(id);
    const type = dto.type ?? existing.type;
    const options = dto.options !== undefined ? dto.options : existing.options;
    const answer = dto.answer !== undefined ? dto.answer : (existing.answer as Record<string, unknown>);
    this.validateQuestionStructure(type, options, answer);

    return this.prisma.question.update({
      where: { id },
      data: {
        type: dto.type,
        content: dto.content,
        options:
          dto.options === undefined ? undefined : (dto.options as Prisma.InputJsonValue),
        answer:
          dto.answer === undefined ? undefined : (dto.answer as Prisma.InputJsonValue),
        difficulty: dto.difficulty,
        moduleId: dto.moduleId,
        isActive: dto.isActive,
      },
    });
  }

  async deleteQuestion(id: string) {
    await this.getQuestion(id);
    // Xóa khỏi các quiz cũng — onDelete: Cascade trên QuizQuestion làm hộ.
    await this.prisma.question.delete({ where: { id } });
    return { ok: true };
  }

  // Kiểm tra cấu trúc options/answer khớp với type — tránh admin nhập bậy.
  private validateQuestionStructure(
    type: QuestionType,
    options: unknown,
    answer: unknown,
  ): void {
    if (!answer || typeof answer !== 'object') {
      throw new BadRequestException('answer phải là JSON object');
    }
    const a = answer as Record<string, unknown>;
    switch (type) {
      case QuestionType.MULTIPLE_CHOICE: {
        if (!Array.isArray(options))
          throw new BadRequestException('options phải là mảng [{key,text}]');
        for (const o of options) {
          if (!o || typeof o !== 'object' || !(o as { key?: unknown }).key || !(o as { text?: unknown }).text) {
            throw new BadRequestException(
              'mỗi option phải có {key, text} — VD {"key":"A","text":"..."}',
            );
          }
        }
        if (typeof a.correct !== 'string') {
          throw new BadRequestException('answer.correct phải là key đáp án đúng (VD "B")');
        }
        const keys = (options as Array<{ key: string }>).map((o) => o.key);
        if (!keys.includes(a.correct as string)) {
          throw new BadRequestException(`answer.correct "${String(a.correct)}" không có trong options`);
        }
        return;
      }
      case QuestionType.MINI_GAME: {
        if (!Array.isArray(options))
          throw new BadRequestException('options phải là mảng [{id,text}]');
        for (const o of options) {
          if (!o || typeof o !== 'object' || !(o as { id?: unknown }).id || !(o as { text?: unknown }).text) {
            throw new BadRequestException('mỗi item phải có {id, text}');
          }
        }
        if (!Array.isArray(a.correctOrder)) {
          throw new BadRequestException('answer.correctOrder phải là mảng id theo thứ tự đúng');
        }
        const ids = (options as Array<{ id: string }>).map((o) => o.id).sort();
        const sortedAns = [...(a.correctOrder as string[])].sort();
        if (
          ids.length !== sortedAns.length ||
          ids.some((id, i) => id !== sortedAns[i])
        ) {
          throw new BadRequestException(
            'answer.correctOrder phải chứa đúng toàn bộ id trong options (cùng tập hợp)',
          );
        }
        return;
      }
      case QuestionType.SITUATION:
      case QuestionType.BOSS_BATTLE: {
        // options không bắt buộc; answer có rubric/keywords/minScore
        if (
          a.keywords !== undefined &&
          !Array.isArray(a.keywords)
        ) {
          throw new BadRequestException('answer.keywords phải là mảng string');
        }
        if (
          a.minScore !== undefined &&
          (typeof a.minScore !== 'number' || a.minScore < 0 || a.minScore > 100)
        ) {
          throw new BadRequestException('answer.minScore phải là số 0..100');
        }
        return;
      }
    }
  }

  // ===== Quizzes =====
  listQuizzes(filter: { moduleId?: string; levelId?: string }) {
    const where: Prisma.QuizWhereInput = {};
    if (filter.moduleId) where.moduleId = filter.moduleId;
    if (filter.levelId) where.levelId = filter.levelId;
    return this.prisma.quiz.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        module: { select: { id: true, title: true, courseId: true } },
        level: { select: { id: true, name: true, order: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    });
  }

  async getQuiz(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        module: true,
        level: true,
        questions: {
          orderBy: { order: 'asc' },
          include: { question: true },
        },
      },
    });
    if (!quiz) throw new NotFoundException('Không tìm thấy bài thi');
    return quiz;
  }

  async createQuiz(dto: CreateQuizDto) {
    await this.ensureQuestionsExist(dto.questionIds);
    return this.prisma.quiz.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        moduleId: dto.moduleId ?? null,
        levelId: dto.levelId ?? null,
        passScore: dto.passScore,
        timeLimitSec: dto.timeLimitSec,
        maxAttempts: dto.maxAttempts,
        isActive: dto.isActive ?? true,
        questions: {
          create: dto.questionIds.map((qid, idx) => ({
            questionId: qid,
            order: idx + 1,
          })),
        },
      },
    });
  }

  async updateQuiz(id: string, dto: UpdateQuizDto) {
    await this.getQuiz(id);

    // Nếu cập nhật danh sách câu hỏi → xóa quan hệ cũ rồi tạo lại.
    if (dto.questionIds) {
      await this.ensureQuestionsExist(dto.questionIds);
      await this.prisma.quizQuestion.deleteMany({ where: { quizId: id } });
      await this.prisma.quizQuestion.createMany({
        data: dto.questionIds.map((qid, idx) => ({
          quizId: id,
          questionId: qid,
          order: idx + 1,
        })),
      });
    }

    return this.prisma.quiz.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        moduleId: dto.moduleId,
        levelId: dto.levelId,
        passScore: dto.passScore,
        timeLimitSec: dto.timeLimitSec,
        maxAttempts: dto.maxAttempts,
        isActive: dto.isActive,
      },
    });
  }

  async deleteQuiz(id: string) {
    await this.getQuiz(id);
    await this.prisma.quiz.delete({ where: { id } });
    return { ok: true };
  }

  private async ensureQuestionsExist(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      throw new BadRequestException('Quiz phải có ít nhất 1 câu hỏi');
    }
    const count = await this.prisma.question.count({ where: { id: { in: ids } } });
    if (count !== ids.length) {
      throw new BadRequestException('Một hoặc nhiều questionId không tồn tại');
    }
  }
}
