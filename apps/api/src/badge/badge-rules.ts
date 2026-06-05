import type { PrismaService } from '../prisma/prisma.service';

// Quy tắc badge — JSON cấu hình được trong Admin (mục 5.7).
// Mỗi rule type là một hàm thuần kiểm tra với DB; trả về true = đủ điều kiện.

export interface BadgeRule {
  type: string;
  [key: string]: unknown;
}

export async function evaluateBadgeRule(
  prisma: PrismaService,
  userId: string,
  rule: BadgeRule,
): Promise<boolean> {
  switch (rule.type) {
    case 'COMPLETE_LESSON': {
      const required = typeof rule.count === 'number' ? rule.count : 1;
      const count = await prisma.lessonProgress.count({
        where: { userId, status: 'COMPLETED' },
      });
      return count >= required;
    }

    case 'STREAK_DAYS': {
      const required = typeof rule.days === 'number' ? rule.days : 30;
      const profile = await prisma.profile.findUnique({ where: { userId } });
      return (profile?.streakCount ?? 0) >= required;
    }

    case 'COMPLETE_BOSS_BATTLE': {
      // Vượt bất kỳ Boss Battle (quiz có levelId) — scope dùng để filter theo
      // tên phòng ban; bỏ qua nếu không match.
      const scope = typeof rule.scope === 'string' ? rule.scope.toLowerCase() : null;
      const attempt = await prisma.quizAttempt.findFirst({
        where: {
          userId,
          passed: true,
          quiz: { levelId: { not: null } },
        },
        include: scope
          ? { quiz: { include: { module: { include: { course: { include: { department: true } } } } } } }
          : undefined,
      });
      if (!attempt) return false;
      if (!scope) return true;
      const deptName = (attempt as { quiz?: { module?: { course?: { department?: { name?: string } } } } })
        .quiz?.module?.course?.department?.name?.toLowerCase();
      return deptName === scope;
    }

    case 'REACH_LEVEL': {
      const required = typeof rule.order === 'number' ? rule.order : 2;
      const profile = await prisma.profile.findUnique({
        where: { userId },
        include: { level: true },
      });
      return (profile?.level?.order ?? 0) >= required;
    }

    case 'COMPLETE_COURSE': {
      // courseId optional — không truyền nghĩa là "bất kỳ course nào hoàn thành".
      const courseId = typeof rule.courseId === 'string' ? rule.courseId : null;
      const lessonWhere = courseId
        ? { module: { courseId } }
        : {};
      const totalLessons = await prisma.lesson.count({ where: lessonWhere });
      if (totalLessons === 0) return false;
      const completed = await prisma.lessonProgress.count({
        where: {
          userId,
          status: 'COMPLETED',
          lesson: lessonWhere,
        },
      });
      return completed === totalLessons;
    }

    case 'QUIZ_PERFECT': {
      // Đạt điểm tuyệt đối 100 ít nhất 1 bài thi
      const required = typeof rule.count === 'number' ? rule.count : 1;
      const count = await prisma.quizAttempt.count({
        where: { userId, score: 100 },
      });
      return count >= required;
    }

    case 'EARN_EXP': {
      const required = typeof rule.amount === 'number' ? rule.amount : 100;
      const profile = await prisma.profile.findUnique({ where: { userId } });
      return (profile?.exp ?? 0) >= required;
    }

    default:
      return false;
  }
}
