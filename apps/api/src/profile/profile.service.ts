import { Injectable, NotFoundException } from '@nestjs/common';
import { ExpAction, LeaderboardPeriod, LeaderboardType, LessonStatus } from '@prisma/client';
import { BadgeService, type BadgeWithStatus } from '../badge/badge.service';
import { startOfWeekVn } from '../common/time';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { MissionService, type MissionWithProgress } from '../mission/mission.service';
import { PrismaService } from '../prisma/prisma.service';

export interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
    department: { id: string; name: string } | null;
  };
  profile: {
    level: { id: string; order: number; name: string; expThreshold: number } | null;
    nextLevel: { order: number; name: string; expThreshold: number } | null;
    exp: number;
    expIntoLevel: number;
    expToNextLevel: number | null;
    streakCount: number;
    stage: string;
    rank: number | null;
  };
  kpi: {
    quizPassRate: number;
    quizAttempts: number;
    coursesCompleted: number;
    lessonsCompleted: number;
    weeklyExp: number;
  };
  recentMilestones: Milestone[];
  badges: BadgeWithStatus[];
  dailyMissions: MissionWithProgress[];
  enrolledCourses: EnrolledCourse[];
}

interface Milestone {
  type: string;
  title: string;
  description: string;
  occurredAt: string;
}

interface EnrolledCourse {
  id: string;
  title: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
}

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly badges: BadgeService,
    private readonly missions: MissionService,
    private readonly leaderboard: LeaderboardService,
  ) {}

  async getDashboard(userId: string): Promise<DashboardData> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: { include: { level: true } },
        department: true,
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const allLevels = await this.prisma.level.findMany({ orderBy: { order: 'asc' } });
    const currentLevel = user.profile?.level ?? allLevels[0]!;
    const nextLevel = allLevels.find((l) => l.order === currentLevel.order + 1) ?? null;
    const exp = user.profile?.exp ?? 0;
    const expIntoLevel = exp - currentLevel.expThreshold;
    const expToNextLevel = nextLevel ? nextLevel.expThreshold - exp : null;

    // Rank — vị trí trên Top Học Tập (all-time).
    const lbResult = await this.leaderboard.get(
      LeaderboardType.TOP_LEARNING,
      LeaderboardPeriod.ALL_TIME,
      userId,
      1000,
    );

    // KPI
    const [quizAttempts, passedAttempts, lessonsCompleted, weeklyExpRow, courses, badges, missionsResult] =
      await Promise.all([
        this.prisma.quizAttempt.count({
          where: {
            userId,
            status: { in: ['PASSED', 'FAILED'] as const },
          },
        }),
        this.prisma.quizAttempt.count({ where: { userId, passed: true } }),
        this.prisma.lessonProgress.count({
          where: { userId, status: LessonStatus.COMPLETED },
        }),
        this.prisma.expTransaction.aggregate({
          where: { userId, createdAt: { gte: startOfWeekVn() } },
          _sum: { amount: true },
        }),
        this.prisma.course.findMany({
          where: { isPublished: true },
          include: { modules: { include: { lessons: { select: { id: true } } } } },
          orderBy: { order: 'asc' },
        }),
        this.badges.listForUser(userId),
        this.missions.evaluateToday(userId),
      ]);

    const quizPassRate = quizAttempts > 0 ? passedAttempts / quizAttempts : 0;
    const weeklyExp = weeklyExpRow._sum.amount ?? 0;

    // Enrolled courses + đếm số khóa hoàn thành
    let coursesCompleted = 0;
    const enrolledCourses: EnrolledCourse[] = [];
    for (const c of courses) {
      const lessonIds = c.modules.flatMap((m) => m.lessons.map((l) => l.id));
      if (lessonIds.length === 0) continue;
      const done = await this.prisma.lessonProgress.count({
        where: {
          userId,
          lessonId: { in: lessonIds },
          status: LessonStatus.COMPLETED,
        },
      });
      if (done === lessonIds.length) coursesCompleted += 1;
      enrolledCourses.push({
        id: c.id,
        title: c.title,
        completedLessons: done,
        totalLessons: lessonIds.length,
        progressPercent: Math.round((done / lessonIds.length) * 100),
      });
    }

    // Recent milestones — lấy từ exp_transactions actions "to" (level up, badge, boss).
    const recentTx = await this.prisma.expTransaction.findMany({
      where: {
        userId,
        action: {
          in: [
            ExpAction.BOSS_BATTLE_PASSED,
            ExpAction.COURSE_COMPLETED,
            ExpAction.MISSION_COMPLETED,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const recentMilestones: Milestone[] = recentTx.map((t) => ({
      type: t.action,
      title: milestoneTitle(t.action),
      description: t.note ?? '',
      occurredAt: t.createdAt.toISOString(),
    }));

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.profile?.avatar ?? null,
        role: user.role,
        department: user.department
          ? { id: user.department.id, name: user.department.name }
          : null,
      },
      profile: {
        level: {
          id: currentLevel.id,
          order: currentLevel.order,
          name: currentLevel.name,
          expThreshold: currentLevel.expThreshold,
        },
        nextLevel: nextLevel
          ? { order: nextLevel.order, name: nextLevel.name, expThreshold: nextLevel.expThreshold }
          : null,
        exp,
        expIntoLevel,
        expToNextLevel,
        streakCount: user.profile?.streakCount ?? 0,
        stage: user.profile?.stage ?? 'ONBOARDING',
        rank: lbResult.myRank?.rank ?? null,
      },
      kpi: {
        quizPassRate,
        quizAttempts,
        coursesCompleted,
        lessonsCompleted,
        weeklyExp,
      },
      recentMilestones,
      badges,
      dailyMissions: missionsResult.all,
      enrolledCourses,
    };
  }
}

function milestoneTitle(action: ExpAction): string {
  switch (action) {
    case ExpAction.BOSS_BATTLE_PASSED:
      return '⚔️ Vượt Boss Battle';
    case ExpAction.COURSE_COMPLETED:
      return '🎓 Hoàn thành khóa học';
    case ExpAction.MISSION_COMPLETED:
      return '🎯 Hoàn thành nhiệm vụ ngày';
    default:
      return 'Cột mốc';
  }
}
