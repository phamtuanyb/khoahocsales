import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LessonStatus, UserRole } from '@prisma/client';
import { startOfWeekVn } from '../common/time';
import { PrismaService } from '../prisma/prisma.service';

export interface TeamMemberRow {
  userId: string;
  email: string;
  name: string;
  avatar: string | null;
  status: string;
  levelOrder: number;
  levelName: string | null;
  exp: number;
  streakCount: number;
  weeklyExp: number;
  lessonsCompleted: number;
  quizzesPassed: number;
  lastActiveAt: string | null;
  daysSinceActive: number | null;
}

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  // GET /team/overview — Manager xem phòng mình; Admin xem mọi phòng (filter qua departmentId).
  async getOverview(
    actorId: string,
    departmentId?: string,
  ): Promise<{
    department: { id: string; name: string } | null;
    members: TeamMemberRow[];
    totals: {
      activeMembers: number;
      inactive7Days: number;
      avgExp: number;
      avgLevel: number;
      totalLessonsCompleted: number;
      totalQuizzesPassed: number;
    };
  }> {
    const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
    if (!actor) throw new NotFoundException('Không tìm thấy người dùng');

    // Manager chỉ xem phòng của mình. Admin có thể chọn phòng (hoặc all).
    let targetDeptId: string | null = null;
    if (actor.role === UserRole.MANAGER) {
      if (!actor.departmentId) {
        throw new ForbiddenException('Tài khoản Manager chưa gán phòng ban');
      }
      targetDeptId = actor.departmentId;
    } else if (actor.role === UserRole.ADMIN) {
      targetDeptId = departmentId ?? null; // null = mọi phòng
    } else {
      throw new ForbiddenException('Chỉ Manager/Admin truy cập được mục này');
    }

    const dept = targetDeptId
      ? await this.prisma.department.findUnique({ where: { id: targetDeptId } })
      : null;

    const members = await this.prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        role: 'LEARNER',
        ...(targetDeptId ? { departmentId: targetDeptId } : {}),
      },
      include: { profile: { include: { level: true } } },
      orderBy: { profile: { exp: 'desc' } },
    });

    const weekStart = startOfWeekVn();

    const rows: TeamMemberRow[] = await Promise.all(
      members.map(async (u) => {
        const [lessonsCompleted, quizzesPassed, weeklyExpAgg] = await Promise.all([
          this.prisma.lessonProgress.count({
            where: { userId: u.id, status: LessonStatus.COMPLETED },
          }),
          this.prisma.quizAttempt.count({ where: { userId: u.id, passed: true } }),
          this.prisma.expTransaction.aggregate({
            where: { userId: u.id, createdAt: { gte: weekStart } },
            _sum: { amount: true },
          }),
        ]);

        const lastActiveAt = u.profile?.lastActiveAt ?? null;
        const daysSinceActive = lastActiveAt
          ? Math.floor((Date.now() - lastActiveAt.getTime()) / (24 * 60 * 60 * 1000))
          : null;

        return {
          userId: u.id,
          email: u.email,
          name: u.name,
          avatar: u.profile?.avatar ?? null,
          status: u.status,
          levelOrder: u.profile?.level?.order ?? 1,
          levelName: u.profile?.level?.name ?? null,
          exp: u.profile?.exp ?? 0,
          streakCount: u.profile?.streakCount ?? 0,
          weeklyExp: weeklyExpAgg._sum.amount ?? 0,
          lessonsCompleted,
          quizzesPassed,
          lastActiveAt: lastActiveAt?.toISOString() ?? null,
          daysSinceActive,
        };
      }),
    );

    const inactive7Days = rows.filter(
      (r) => r.daysSinceActive === null || r.daysSinceActive >= 7,
    ).length;
    const avgExp =
      rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.exp, 0) / rows.length) : 0;
    const avgLevel =
      rows.length > 0
        ? Math.round((rows.reduce((s, r) => s + r.levelOrder, 0) / rows.length) * 10) / 10
        : 0;
    const totalLessonsCompleted = rows.reduce((s, r) => s + r.lessonsCompleted, 0);
    const totalQuizzesPassed = rows.reduce((s, r) => s + r.quizzesPassed, 0);

    return {
      department: dept ? { id: dept.id, name: dept.name } : null,
      members: rows,
      totals: {
        activeMembers: rows.length,
        inactive7Days,
        avgExp,
        avgLevel,
        totalLessonsCompleted,
        totalQuizzesPassed,
      },
    };
  }
}
