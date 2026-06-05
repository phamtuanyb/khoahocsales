import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LeaderboardPeriod, LeaderboardType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LeaderboardService } from './leaderboard.service';

// Cron 5 phút/lần: snapshot top 200 cho mỗi board × period vào bảng leaderboard_entries.
// Mục đích: API GET /leaderboard sau này có thể đọc từ snapshot thay vì recompute mỗi request.
// (Hiện tại LeaderboardService vẫn compute on-the-fly — sẽ chuyển sang đọc snapshot sau khi
// đủ rows snapshot tích lũy, để tránh stale.)
@Injectable()
export class LeaderboardSnapshotService {
  private readonly logger = new Logger(LeaderboardSnapshotService.name);
  private readonly TOP_N = 200;

  constructor(
    private readonly prisma: PrismaService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'leaderboardSnapshot' })
  async runSnapshot(): Promise<void> {
    const start = Date.now();
    const boards: LeaderboardType[] = [
      LeaderboardType.TOP_LEARNING,
      LeaderboardType.TOP_DILIGENT,
      LeaderboardType.WEEKLY_WARRIOR,
    ];
    const periods: LeaderboardPeriod[] = [
      LeaderboardPeriod.WEEKLY,
      LeaderboardPeriod.MONTHLY,
      LeaderboardPeriod.ALL_TIME,
    ];

    let totalRows = 0;
    for (const board of boards) {
      for (const period of periods) {
        const periodKey = this.periodKeyFor(period);
        try {
          // Recompute board hiện tại
          const result = await this.leaderboardService.get(board, period, '_snapshot_', this.TOP_N);

          // Xóa entries cũ cùng (board, period, periodKey)
          await this.prisma.leaderboardEntry.deleteMany({
            where: { boardType: board, period, periodKey },
          });

          // Insert mới
          if (result.rows.length > 0) {
            await this.prisma.leaderboardEntry.createMany({
              data: result.rows.map((r) => ({
                userId: r.userId,
                boardType: board,
                period,
                periodKey,
                score: r.score,
                rank: r.rank,
              })),
              skipDuplicates: true,
            });
            totalRows += result.rows.length;
          }
        } catch (err) {
          this.logger.error(
            `Snapshot ${board}/${period} thất bại`,
            err as Error,
          );
        }
      }
    }

    this.logger.log(
      `Snapshot leaderboard xong — ${totalRows} rows trong ${Date.now() - start}ms`,
    );
  }

  // Khóa định danh chu kỳ — VD "2026-W21", "2026-05", "ALL".
  private periodKeyFor(period: LeaderboardPeriod): string {
    const d = new Date();
    if (period === LeaderboardPeriod.WEEKLY) {
      const onejan = new Date(d.getUTCFullYear(), 0, 1);
      const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getUTCDay() + 1) / 7);
      return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
    }
    if (period === LeaderboardPeriod.MONTHLY) {
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    }
    return 'ALL';
  }
}
