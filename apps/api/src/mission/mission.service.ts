import { Injectable } from '@nestjs/common';
import { LessonStatus } from '@prisma/client';
import { startOfDayVn } from '../common/time';
import { PrismaService } from '../prisma/prisma.service';

interface MissionRule {
  type: string;
  count?: number;
}

export interface MissionWithProgress {
  missionId: string;
  title: string;
  description: string | null;
  rewardExp: number;
  ruleType: string;
  current: number;
  required: number;
  completed: boolean;
  completedAt: string | null;
}

export interface EvaluateMissionResult {
  all: MissionWithProgress[];
  justCompleted: Array<{
    missionId: string;
    title: string;
    rewardExp: number;
  }>;
}

@Injectable()
export class MissionService {
  constructor(private readonly prisma: PrismaService) {}

  // Đánh giá lại nhiệm vụ ngày — idempotent. Trả về cả danh sách hiển thị + những
  // nhiệm vụ vừa hoàn thành (caller cần để cộng EXP qua GamificationService).
  async evaluateToday(userId: string): Promise<EvaluateMissionResult> {
    const today = startOfDayVn();
    const missions = await this.prisma.mission.findMany({
      where: { isActive: true, isDaily: true },
      orderBy: { createdAt: 'asc' },
    });

    const all: MissionWithProgress[] = [];
    const justCompleted: EvaluateMissionResult['justCompleted'] = [];

    for (const m of missions) {
      const rule = (m.rule as unknown as MissionRule) ?? { type: 'UNKNOWN' };
      const required = rule.count ?? 1;
      const current = await this.countAction(userId, rule.type, today);
      const shouldComplete = current >= required;

      let progress = await this.prisma.missionProgress.findUnique({
        where: { userId_missionId_date: { userId, missionId: m.id, date: today } },
      });

      if (!progress) {
        progress = await this.prisma.missionProgress.create({
          data: {
            userId,
            missionId: m.id,
            date: today,
            completed: shouldComplete,
            completedAt: shouldComplete ? new Date() : null,
          },
        });
        if (shouldComplete) {
          justCompleted.push({
            missionId: m.id,
            title: m.title,
            rewardExp: m.rewardExp,
          });
        }
      } else if (shouldComplete && !progress.completed) {
        progress = await this.prisma.missionProgress.update({
          where: { id: progress.id },
          data: { completed: true, completedAt: new Date() },
        });
        justCompleted.push({
          missionId: m.id,
          title: m.title,
          rewardExp: m.rewardExp,
        });
      }

      all.push({
        missionId: m.id,
        title: m.title,
        description: m.description,
        rewardExp: m.rewardExp,
        ruleType: rule.type,
        current: Math.min(current, required),
        required,
        completed: progress.completed,
        completedAt: progress.completedAt?.toISOString() ?? null,
      });
    }

    return { all, justCompleted };
  }

  // Đếm số lần hành động X user đã làm hôm nay.
  private async countAction(
    userId: string,
    ruleType: string,
    today: Date,
  ): Promise<number> {
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    switch (ruleType) {
      case 'COMPLETE_LESSON':
        return this.prisma.lessonProgress.count({
          where: {
            userId,
            status: LessonStatus.COMPLETED,
            completedAt: { gte: today, lt: tomorrow },
          },
        });

      case 'CORRECT_ANSWERS': {
        // Tổng số câu đúng trong các bài thi đã nộp hôm nay.
        // Approx: lấy quiz_attempts hôm nay → sum(score * totalQuestions / 100)
        // Đơn giản hơn: dùng số attempts ×  pass=true làm proxy. Tốt nhất lưu chi tiết
        // trong answers JSON. Tạm thời: đếm dòng exp_transactions QUIZ_CORRECT_ANSWER
        // hôm nay, chia cho 20 (EXP/câu).
        const sumRow = await this.prisma.expTransaction.aggregate({
          where: {
            userId,
            action: 'QUIZ_CORRECT_ANSWER',
            createdAt: { gte: today, lt: tomorrow },
          },
          _sum: { amount: true },
        });
        const totalExp = sumRow._sum.amount ?? 0;
        return Math.floor(totalExp / 20);
      }

      case 'WATCH_VIDEO':
        // MVP chưa có sự kiện "đã xem video" — đếm lesson có videoUrl được mở
        // (xem như đã xem) trong ngày.
        return this.prisma.lessonProgress.count({
          where: {
            userId,
            createdAt: { gte: today, lt: tomorrow },
            lesson: { videoUrl: { not: null } },
          },
        });

      default:
        return 0;
    }
  }
}
