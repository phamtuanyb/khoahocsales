import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ExpAction,
  LessonStatus,
  UserRole,
} from '@prisma/client';
import {
  GamificationService,
  LevelUpInfo,
} from '../gamification/gamification.service';
import { PrismaService } from '../prisma/prisma.service';

// EXP cộng khi hoàn thành 1 bài học (spec mục 5.5).
const LESSON_COMPLETION_EXP = 10;

@Injectable()
export class LearningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
  ) {}

  // GET /courses — danh sách khóa học cho user (lọc theo phòng ban; Admin xem hết).
  async listCourses(userId: string): Promise<CourseSummaryDto[]> {
    const user = await this.requireUser(userId);

    const courses = await this.prisma.course.findMany({
      where: {
        isPublished: true,
        ...(user.role === UserRole.ADMIN
          ? {}
          : { departmentId: user.departmentId ?? undefined }),
      },
      include: {
        department: true,
        modules: {
          select: { id: true, lessons: { select: { id: true } } },
        },
      },
      orderBy: { order: 'asc' },
    });

    const lessonIds = courses.flatMap((c) =>
      c.modules.flatMap((m) => m.lessons.map((l) => l.id)),
    );
    const progressByLesson = await this.fetchProgressMap(userId, lessonIds);

    return courses.map((course) => {
      const totalLessons = course.modules.reduce(
        (sum, m) => sum + m.lessons.length,
        0,
      );
      const completedLessons = course.modules.reduce(
        (sum, m) =>
          sum +
          m.lessons.filter(
            (l) => progressByLesson.get(l.id)?.status === LessonStatus.COMPLETED,
          ).length,
        0,
      );
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        order: course.order,
        department: { id: course.department.id, name: course.department.name },
        moduleCount: course.modules.length,
        totalLessons,
        completedLessons,
        progressPercent:
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0,
      };
    });
  }

  // GET /courses/:id — cây mô-đun + bài học + thông tin quiz kèm trạng thái.
  async getCourse(userId: string, courseId: string): Promise<CourseTreeDto> {
    const user = await this.requireUser(userId);
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        department: true,
        modules: {
          include: {
            lessons: { orderBy: { order: 'asc' } },
            quizzes: {
              where: { isActive: true, levelId: null },
              orderBy: { createdAt: 'asc' },
              take: 1,
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }
    this.assertCourseAccess(user, course.departmentId);

    const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
    const progressByLesson = await this.fetchProgressMap(userId, lessonIds);

    // Lấy thông tin attempts cho tất cả module quizzes trong course.
    const quizIds = course.modules
      .map((m) => m.quizzes[0]?.id)
      .filter((id): id is string => Boolean(id));
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { userId, quizId: { in: quizIds } },
      select: { quizId: true, score: true, passed: true, status: true },
    });
    const bestByQuiz = new Map<string, { bestScore: number; passed: boolean; attempts: number }>();
    for (const a of attempts) {
      const cur = bestByQuiz.get(a.quizId) ?? { bestScore: 0, passed: false, attempts: 0 };
      cur.attempts += 1;
      if (a.score > cur.bestScore) cur.bestScore = a.score;
      if (a.passed) cur.passed = true;
      bestByQuiz.set(a.quizId, cur);
    }

    // Tính lock từng mô-đun: M1 luôn mở; M_N mở khi M_{N-1} 100% bài học + đỗ quiz (nếu có).
    const moduleStatuses: ModuleStatus[] = [];
    for (let i = 0; i < course.modules.length; i++) {
      const mod = course.modules[i]!;
      const completed = mod.lessons.filter(
        (l) => progressByLesson.get(l.id)?.status === LessonStatus.COMPLETED,
      ).length;
      const prev = i > 0 ? moduleStatuses[i - 1]! : null;
      const locked = prev
        ? prev.locked || prev.completed < prev.total
        : false;
      moduleStatuses.push({
        moduleId: mod.id,
        locked,
        completed,
        total: mod.lessons.length,
      });
    }

    let totalLessons = 0;
    let completedLessons = 0;

    const modulesDto = course.modules.map((mod, idx) => {
      const status = moduleStatuses[idx]!;
      totalLessons += status.total;
      completedLessons += status.completed;

      const quiz = mod.quizzes[0];
      const quizInfo = bestByQuiz.get(quiz?.id ?? '');

      return {
        id: mod.id,
        title: mod.title,
        description: mod.description,
        order: mod.order,
        locked: status.locked,
        completedLessons: status.completed,
        totalLessons: status.total,
        progressPercent:
          status.total > 0
            ? Math.round((status.completed / status.total) * 100)
            : 0,
        lessons: mod.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          hasVideo: Boolean(lesson.videoUrl),
          status: this.lessonStatus(
            status.locked,
            progressByLesson.get(lesson.id)?.status,
          ),
        })),
        quiz: quiz
          ? {
              id: quiz.id,
              title: quiz.title,
              passScore: quiz.passScore,
              timeLimitSec: quiz.timeLimitSec,
              maxAttempts: quiz.maxAttempts,
              attemptsUsed: quizInfo?.attempts ?? 0,
              bestScore: quizInfo?.bestScore ?? null,
              passed: quizInfo?.passed ?? false,
              // Quiz cũng khóa nếu mô-đun bị khóa hoặc chưa hoàn thành 100% bài học.
              locked: status.locked || status.completed < status.total,
            }
          : null,
      };
    });

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      department: { id: course.department.id, name: course.department.name },
      totalLessons,
      completedLessons,
      progressPercent:
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0,
      modules: modulesDto,
    };
  }

  // GET /lessons/:id
  async getLesson(userId: string, lessonId: string): Promise<LessonDetailDto> {
    const user = await this.requireUser(userId);
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: { include: { department: true } },
            lessons: {
              select: { id: true, title: true, order: true },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
    if (!lesson) {
      throw new NotFoundException('Không tìm thấy bài học');
    }
    this.assertCourseAccess(user, lesson.module.course.departmentId);

    if (
      await this.isModuleLocked(userId, lesson.module.id, lesson.module.courseId)
    ) {
      throw new ForbiddenException(
        'Bài học đang bị khóa. Hoàn thành mô-đun trước để mở khóa.',
      );
    }

    const progress = await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {},
      create: { userId, lessonId, status: LessonStatus.IN_PROGRESS },
    });

    const siblings = lesson.module.lessons;
    const idx = siblings.findIndex((s) => s.id === lesson.id);
    const prevLessonId = idx > 0 ? siblings[idx - 1]!.id : null;
    const nextLessonId =
      idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1]!.id : null;

    return {
      id: lesson.id,
      title: lesson.title,
      content: lesson.content,
      videoUrl: lesson.videoUrl,
      order: lesson.order,
      module: {
        id: lesson.module.id,
        title: lesson.module.title,
        order: lesson.module.order,
        courseId: lesson.module.courseId,
        courseTitle: lesson.module.course.title,
      },
      navigation: { prevLessonId, nextLessonId },
      progress: {
        status: progress.status,
        completedAt: progress.completedAt,
      },
    };
  }

  // POST /lessons/:id/complete
  async completeLesson(
    userId: string,
    lessonId: string,
  ): Promise<CompleteLessonResult> {
    const user = await this.requireUser(userId);
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: { select: { id: true, departmentId: true } },
            lessons: { select: { id: true } },
          },
        },
      },
    });
    if (!lesson) {
      throw new NotFoundException('Không tìm thấy bài học');
    }
    this.assertCourseAccess(user, lesson.module.course.departmentId);

    if (
      await this.isModuleLocked(userId, lesson.module.id, lesson.module.course.id)
    ) {
      throw new ForbiddenException('Bài học đang bị khóa, không thể hoàn thành.');
    }

    const existing = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    const wasAlreadyCompleted = existing?.status === LessonStatus.COMPLETED;

    const progress = await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { status: LessonStatus.COMPLETED, completedAt: new Date() },
      create: {
        userId,
        lessonId,
        status: LessonStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    // Cộng EXP chỉ lần đầu hoàn thành — qua GamificationService để check
    // Level Up + cascade (streak/mission/badge/cert).
    let expAwarded = 0;
    let levelUp: LevelUpInfo | null = null;
    let cascade: CascadeData = {};
    if (!wasAlreadyCompleted) {
      const result = await this.gamification.addExp({
        userId,
        action: ExpAction.LESSON_COMPLETED,
        amount: LESSON_COMPLETION_EXP,
        refType: 'lesson',
        refId: lessonId,
        note: `Hoàn thành bài: ${lesson.title}`,
      });
      expAwarded = result.expAdded;
      levelUp = result.levelUp;
      cascade = {
        newBadges: result.newBadges?.map((b) => ({
          id: b.id,
          name: b.name,
          icon: b.icon,
          description: b.description,
        })),
        newCertificates: result.newCertificates?.map((c) => ({
          id: c.id,
          type: c.type,
          code: c.code,
        })),
        newMissionsCompleted: result.newMissionsCompleted,
        streakIncreased: result.streakIncreased,
        streakCount: result.streakCount,
      };
    }

    const moduleLessonIds = lesson.module.lessons.map((l) => l.id);
    const completedInModule = await this.prisma.lessonProgress.count({
      where: {
        userId,
        lessonId: { in: moduleLessonIds },
        status: LessonStatus.COMPLETED,
      },
    });

    return {
      lesson: {
        id: progress.lessonId,
        status: progress.status,
        completedAt: progress.completedAt,
      },
      module: {
        id: lesson.module.id,
        completedLessons: completedInModule,
        totalLessons: moduleLessonIds.length,
        progressPercent:
          moduleLessonIds.length > 0
            ? Math.round((completedInModule / moduleLessonIds.length) * 100)
            : 0,
        moduleCompleted: completedInModule === moduleLessonIds.length,
      },
      expAwarded,
      wasAlreadyCompleted,
      levelUp,
      ...cascade,
    };
  }

  // ---------- helpers ----------

  private async requireUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, departmentId: true },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  private assertCourseAccess(
    user: { role: UserRole; departmentId: string | null },
    courseDepartmentId: string,
  ): void {
    if (user.role === UserRole.ADMIN) return;
    if (user.departmentId !== courseDepartmentId) {
      throw new ForbiddenException('Bạn không có quyền truy cập khóa học này');
    }
  }

  private async fetchProgressMap(userId: string, lessonIds: string[]) {
    if (lessonIds.length === 0) return new Map();
    const rows = await this.prisma.lessonProgress.findMany({
      where: { userId, lessonId: { in: lessonIds } },
    });
    return new Map(rows.map((r) => [r.lessonId, r] as const));
  }

  private lessonStatus(
    moduleLocked: boolean,
    progressStatus: LessonStatus | undefined,
  ): LessonStatus {
    if (moduleLocked) return LessonStatus.LOCKED;
    if (progressStatus === LessonStatus.COMPLETED) return LessonStatus.COMPLETED;
    if (progressStatus === LessonStatus.IN_PROGRESS)
      return LessonStatus.IN_PROGRESS;
    return LessonStatus.AVAILABLE;
  }

  private async isModuleLocked(
    userId: string,
    moduleId: string,
    courseId: string,
  ): Promise<boolean> {
    const modules = await this.prisma.module.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      select: { id: true, lessons: { select: { id: true } } },
    });
    const idx = modules.findIndex((m) => m.id === moduleId);
    if (idx <= 0) return false;

    const prevModule = modules[idx - 1]!;
    const prevLessonIds = prevModule.lessons.map((l) => l.id);
    if (prevLessonIds.length === 0) return false;

    const completedCount = await this.prisma.lessonProgress.count({
      where: {
        userId,
        lessonId: { in: prevLessonIds },
        status: LessonStatus.COMPLETED,
      },
    });
    return completedCount < prevLessonIds.length;
  }
}

// ---------- DTOs ----------

interface ModuleStatus {
  moduleId: string;
  locked: boolean;
  completed: number;
  total: number;
}

export interface CourseSummaryDto {
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

export interface CourseTreeDto {
  id: string;
  title: string;
  description: string | null;
  department: { id: string; name: string };
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  modules: ModuleDto[];
}

export interface ModuleDto {
  id: string;
  title: string;
  description: string | null;
  order: number;
  locked: boolean;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  lessons: LessonSummaryDto[];
  quiz: ModuleQuizDto | null;
}

export interface ModuleQuizDto {
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

export interface LessonSummaryDto {
  id: string;
  title: string;
  order: number;
  hasVideo: boolean;
  status: LessonStatus;
}

export interface LessonDetailDto {
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
    completedAt: Date | null;
  };
}

export interface CompleteLessonResult {
  lesson: {
    id: string;
    status: LessonStatus;
    completedAt: Date | null;
  };
  module: {
    id: string;
    completedLessons: number;
    totalLessons: number;
    progressPercent: number;
    moduleCompleted: boolean;
  };
  expAwarded: number;
  wasAlreadyCompleted: boolean;
  levelUp: LevelUpInfo | null;
  newBadges?: Array<{ id: string; name: string; icon: string; description: string }>;
  newCertificates?: Array<{ id: string; type: string; code: string }>;
  newMissionsCompleted?: Array<{ missionId: string; title: string; rewardExp: number }>;
  streakIncreased?: boolean;
  streakCount?: number;
}

type CascadeData = Pick<
  CompleteLessonResult,
  | 'newBadges'
  | 'newCertificates'
  | 'newMissionsCompleted'
  | 'streakIncreased'
  | 'streakCount'
>;

