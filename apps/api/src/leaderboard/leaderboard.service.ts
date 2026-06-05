import { Injectable } from '@nestjs/common';
import { LeaderboardPeriod, LeaderboardType, LessonStatus, Prisma } from '@prisma/client';
import { startOfMonthVn, startOfWeekVn } from '../common/time';
import { PrismaService } from '../prisma/prisma.service';

export interface LeaderboardRow {
  rank: number;
  userId: string;
  name: string;
  avatar: string | null;
  department: string | null;
  level: number;
  levelName: string | null;
  score: number;
  metric: string;
  isMe?: boolean;
}

export interface LeaderboardResult {
  boardType: LeaderboardType;
  period: LeaderboardPeriod;
  rows: LeaderboardRow[];
  myRank: LeaderboardRow | null;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async get(
    boardType: LeaderboardType,
    period: LeaderboardPeriod,
    viewerUserId: string,
    limit = 50,
  ): Promise<LeaderboardResult> {
    let rows: LeaderboardRow[] = [];
    switch (boardType) {
      case LeaderboardType.TOP_LEARNING:
      case LeaderboardType.WEEKLY_WARRIOR:
        // WEEKLY_WARRIOR = Top Learning trong tuần (xuất sắc nhất tuần).
        rows = await this.byExpInPeriod(
          boardType === LeaderboardType.WEEKLY_WARRIOR ? LeaderboardPeriod.WEEKLY : period,
          limit,
        );
        break;
      case LeaderboardType.TOP_DILIGENT:
        rows = await this.byStreak(limit);
        break;
      case LeaderboardType.TOP_SALES:
      case LeaderboardType.TOP_SUPPORT:
        // MVP chưa có KPI thực tế; rỗng tạm thời.
        rows = [];
        break;
    }

    // Đánh dấu dòng của user hiện tại + tính myRank nếu không trong top.
    let myRank: LeaderboardRow | null = null;
    const meRow = rows.find((r) => r.userId === viewerUserId);
    if (meRow) {
      meRow.isMe = true;
      myRank = meRow;
    } else {
      myRank = await this.computeRankFor(viewerUserId, boardType, period);
    }

    return { boardType, period, rows, myRank };
  }

  // EXP theo khoảng thời gian — group by user, sum amount từ exp_transactions.
  private async byExpInPeriod(
    period: LeaderboardPeriod,
    limit: number,
  ): Promise<LeaderboardRow[]> {
    const where: Prisma.ExpTransactionWhereInput = {};
    if (period === LeaderboardPeriod.WEEKLY)
      where.createdAt = { gte: startOfWeekVn() };
    else if (period === LeaderboardPeriod.MONTHLY)
      where.createdAt = { gte: startOfMonthVn() };

    const grouped = await this.prisma.expTransaction.groupBy({
      by: ['userId'],
      where,
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });
    if (grouped.length === 0) return [];

    const userIds = grouped.map((g) => g.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      include: {
        profile: { include: { level: true } },
        department: true,
      },
    });
    const usersById = new Map(users.map((u) => [u.id, u]));

    return grouped.map((g, idx) => {
      const u = usersById.get(g.userId)!;
      return {
        rank: idx + 1,
        userId: u.id,
        name: u.name,
        avatar: u.profile?.avatar ?? null,
        department: u.department?.name ?? null,
        level: u.profile?.level?.order ?? 1,
        levelName: u.profile?.level?.name ?? null,
        score: g._sum.amount ?? 0,
        metric: 'EXP',
      };
    });
  }

  // Sắp xếp theo streak desc, tie-break số bài đã hoàn thành.
  private async byStreak(limit: number): Promise<LeaderboardRow[]> {
    const profiles = await this.prisma.profile.findMany({
      include: {
        user: { include: { department: true } },
        level: true,
      },
      orderBy: { streakCount: 'desc' },
      take: limit * 2, // lấy nhiều hơn rồi tie-break
    });
    const enriched = await Promise.all(
      profiles.map(async (p) => {
        const lessonsCompleted = await this.prisma.lessonProgress.count({
          where: { userId: p.userId, status: LessonStatus.COMPLETED },
        });
        return { p, lessonsCompleted };
      }),
    );
    enriched.sort(
      (a, b) =>
        b.p.streakCount - a.p.streakCount || b.lessonsCompleted - a.lessonsCompleted,
    );
    return enriched.slice(0, limit).map((e, idx) => ({
      rank: idx + 1,
      userId: e.p.userId,
      name: e.p.user.name,
      avatar: e.p.avatar,
      department: e.p.user.department?.name ?? null,
      level: e.p.level?.order ?? 1,
      levelName: e.p.level?.name ?? null,
      score: e.p.streakCount,
      metric: 'NGÀY STREAK',
    }));
  }

  // Tính riêng vị trí của 1 user (cho người ngoài top hiển thị "Bạn đang #N").
  // QUAN TRỌNG: KHÔNG gọi this.get() ở đây — sẽ tạo vòng lặp vô hạn khi user
  // không có trong top. Gọi thẳng helper byExp/byStreak.
  private async computeRankFor(
    userId: string,
    boardType: LeaderboardType,
    period: LeaderboardPeriod,
  ): Promise<LeaderboardRow | null> {
    if (boardType === LeaderboardType.TOP_SALES || boardType === LeaderboardType.TOP_SUPPORT) {
      return null;
    }
    // Lấy full board top 1000 (đủ cho MVP <1000 user).
    let fullRows: LeaderboardRow[] = [];
    if (boardType === LeaderboardType.TOP_DILIGENT) {
      fullRows = await this.byStreak(1000);
    } else {
      const effectivePeriod =
        boardType === LeaderboardType.WEEKLY_WARRIOR ? LeaderboardPeriod.WEEKLY : period;
      fullRows = await this.byExpInPeriod(effectivePeriod, 1000);
    }
    const me = fullRows.find((r) => r.userId === userId);
    if (!me) return null;
    return { ...me, isMe: true };
  }
}
