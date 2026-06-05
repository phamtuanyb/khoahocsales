import { Injectable } from '@nestjs/common';
import { Badge } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { evaluateBadgeRule, type BadgeRule } from './badge-rules';

export interface BadgeWithStatus {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
  earnedAt: string | null;
}

@Injectable()
export class BadgeService {
  constructor(private readonly prisma: PrismaService) {}

  // Đánh giá toàn bộ badge cho user — idempotent (gọi nhiều lần OK).
  // Trả về danh sách badge MỚI nhận trong lần gọi này (để FE chạy hiệu ứng phát sáng).
  async evaluateAll(userId: string): Promise<Badge[]> {
    const [badges, existing] = await Promise.all([
      this.prisma.badge.findMany({ where: { isActive: true } }),
      this.prisma.userBadge.findMany({
        where: { userId },
        select: { badgeId: true },
      }),
    ]);
    const earnedIds = new Set(existing.map((e) => e.badgeId));

    const newlyEarned: Badge[] = [];
    for (const badge of badges) {
      if (earnedIds.has(badge.id)) continue;
      const rule = badge.rule as unknown as BadgeRule;
      if (!rule || typeof rule.type !== 'string') continue;
      const ok = await evaluateBadgeRule(this.prisma, userId, rule);
      if (ok) {
        await this.prisma.userBadge.create({
          data: { userId, badgeId: badge.id },
        });
        newlyEarned.push(badge);
      }
    }
    return newlyEarned;
  }

  // Lấy danh sách badge kèm trạng thái cho user (cho dashboard + trang badges).
  async listForUser(userId: string): Promise<BadgeWithStatus[]> {
    const [badges, userBadges] = await Promise.all([
      this.prisma.badge.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.userBadge.findMany({ where: { userId } }),
    ]);
    const earnedMap = new Map(userBadges.map((ub) => [ub.badgeId, ub.earnedAt]));
    return badges.map((b) => ({
      id: b.id,
      name: b.name,
      icon: b.icon,
      description: b.description,
      earned: earnedMap.has(b.id),
      earnedAt: earnedMap.get(b.id)?.toISOString() ?? null,
    }));
  }
}
