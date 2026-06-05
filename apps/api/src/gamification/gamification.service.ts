import { Injectable } from '@nestjs/common';
import { Badge, Certificate, ExpAction } from '@prisma/client';
import { BadgeService } from '../badge/badge.service';
import { CertificateService } from '../certificate/certificate.service';
import { LeaderboardGateway } from '../leaderboard/leaderboard.gateway';
import { MissionService } from '../mission/mission.service';
import { PrismaService } from '../prisma/prisma.service';
import { StreakService } from '../streak/streak.service';
import { ExpRulesService } from './exp-rules.service';

export interface AddExpInput {
  userId: string;
  action: ExpAction;
  amount: number;
  refType?: string;
  refId?: string;
  note?: string;
}

export interface LevelUpInfo {
  fromLevel: { id: string; order: number; name: string };
  toLevel: { id: string; order: number; name: string; expThreshold: number };
}

export interface AddExpResult {
  totalExp: number;
  expAdded: number;
  levelUp: LevelUpInfo | null;
  // Phần cascade — chỉ điền ở lần gọi top-level (không phải mission-recursion).
  newBadges?: Badge[];
  newCertificates?: Certificate[];
  newMissionsCompleted?: Array<{ missionId: string; title: string; rewardExp: number }>;
  streakIncreased?: boolean;
  streakCount?: number;
}

// Service trung tâm — mọi nơi cộng EXP đều đi qua đây.
// Cascade tự động sau mỗi sự kiện EXP:
//   1. EXP + Level Up
//   2. Streak update
//   3. Mission daily check (cộng EXP thưởng nếu vừa hoàn thành — không recursion)
//   4. Badge check (idempotent)
//   5. Certificate auto-issue
//   6. Phát socket invalidation leaderboard
@Injectable()
export class GamificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly streak: StreakService,
    private readonly missions: MissionService,
    private readonly badges: BadgeService,
    private readonly certificates: CertificateService,
    private readonly leaderboardGateway: LeaderboardGateway,
    private readonly expRules: ExpRulesService,
  ) {}

  async addExp(input: AddExpInput): Promise<AddExpResult> {
    // Override amount nếu Admin đã cấu hình bảng quy đổi cho action này.
    // Caller chỉ cần truyền action — amount input là fallback.
    const ruleAmount = await this.expRules.getAmount(input.action);
    const effective: AddExpInput =
      ruleAmount !== null && input.action !== ExpAction.ADMIN_ADJUSTMENT
        ? { ...input, amount: ruleAmount }
        : input;

    // EXP + Level update (core).
    const core = await this.addExpRaw(effective);

    // Phần thưởng nhiệm vụ là EXP-driven nhưng KHÔNG kích cascade lần nữa,
    // tránh vòng lặp Mission→EXP→Mission.
    const isMissionReward = input.action === ExpAction.MISSION_COMPLETED;
    if (isMissionReward) {
      this.leaderboardGateway.broadcastInvalidation(`mission-reward:${input.userId}`);
      return core;
    }

    // 1) Streak (chỉ tính cho hành động "hoạt động", không tính ADMIN_ADJUSTMENT).
    let streakInfo: { streakCount: number; increased: boolean } | null = null;
    if (input.action !== ExpAction.ADMIN_ADJUSTMENT) {
      streakInfo = await this.streak.touch(input.userId);
    }

    // 2) Mission — đánh giá lại nhiệm vụ ngày
    const missionEval = await this.missions.evaluateToday(input.userId);
    const newMissionsCompleted = missionEval.justCompleted;
    let extraExpFromMissions = 0;
    for (const m of newMissionsCompleted) {
      const r = await this.addExpRaw({
        userId: input.userId,
        action: ExpAction.MISSION_COMPLETED,
        amount: m.rewardExp,
        refType: 'mission',
        refId: m.missionId,
        note: `Hoàn thành nhiệm vụ: ${m.title}`,
      });
      extraExpFromMissions += r.expAdded;
      // Level Up từ mission reward — ghi đè vào kết quả cuối.
      if (r.levelUp && !core.levelUp) {
        core.levelUp = r.levelUp;
      }
    }

    // 3) Badge — kiểm tra sau khi tất cả EXP cộng xong
    const newBadges = await this.badges.evaluateAll(input.userId);

    // 4) Certificate — kiểm tra & cấp tự động
    const newCertificates = await this.certificates.checkAndIssue(input.userId);

    // 5) Realtime: phát tín hiệu để client refetch leaderboard
    this.leaderboardGateway.broadcastInvalidation(`exp:${input.userId}`);

    return {
      ...core,
      totalExp: core.totalExp + extraExpFromMissions,
      expAdded: core.expAdded + extraExpFromMissions,
      newBadges,
      newCertificates,
      newMissionsCompleted,
      streakIncreased: streakInfo?.increased ?? false,
      streakCount: streakInfo?.streakCount,
    };
  }

  // EXP + Level — KHÔNG cascade. Dùng cho mission reward để tránh recursion.
  private async addExpRaw(input: AddExpInput): Promise<AddExpResult> {
    if (input.amount <= 0) {
      const profile = await this.prisma.profile.findUnique({
        where: { userId: input.userId },
      });
      return { totalExp: profile?.exp ?? 0, expAdded: 0, levelUp: null };
    }

    const allLevels = await this.prisma.level.findMany({
      orderBy: { order: 'asc' },
    });

    const profile =
      (await this.prisma.profile.findUnique({
        where: { userId: input.userId },
        include: { level: true },
      })) ??
      (await this.prisma.profile.create({
        data: {
          userId: input.userId,
          exp: 0,
          streakCount: 0,
          levelId: allLevels[0]?.id ?? null,
        },
        include: { level: true },
      }));

    const oldLevel = profile.level ?? allLevels[0]!;
    const newExp = profile.exp + input.amount;
    const eligible = allLevels.filter((l) => l.expThreshold <= newExp);
    const newLevel = eligible[eligible.length - 1] ?? oldLevel;

    const levelUp: LevelUpInfo | null =
      newLevel.order > oldLevel.order
        ? {
            fromLevel: { id: oldLevel.id, order: oldLevel.order, name: oldLevel.name },
            toLevel: {
              id: newLevel.id,
              order: newLevel.order,
              name: newLevel.name,
              expThreshold: newLevel.expThreshold,
            },
          }
        : null;

    await this.prisma.$transaction([
      this.prisma.expTransaction.create({
        data: {
          userId: input.userId,
          action: input.action,
          amount: input.amount,
          refType: input.refType ?? null,
          refId: input.refId ?? null,
          note: input.note ?? null,
        },
      }),
      this.prisma.profile.update({
        where: { userId: input.userId },
        data: { exp: newExp, levelId: newLevel.id },
      }),
    ]);

    return { totalExp: newExp, expAdded: input.amount, levelUp };
  }
}
