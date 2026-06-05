import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExpAction, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { ExpRulesService } from '../gamification/exp-rules.service';
import { GamificationService } from '../gamification/gamification.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AdjustExpDto,
  CreateBadgeDto,
  CreateLevelDto,
  CreateMissionDto,
  ForceUnlockDto,
  UpdateBadgeDto,
  UpdateExpRuleDto,
  UpdateLevelDto,
  UpdateMissionDto,
} from './dto/config.dto';

@Injectable()
export class AdminConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly expRules: ExpRulesService,
    private readonly gamification: GamificationService,
    private readonly audit: AuditService,
  ) {}

  // ============ LEVELS ============
  listLevels() {
    return this.prisma.level.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { profiles: true } } },
    });
  }

  async createLevel(dto: CreateLevelDto) {
    const existing = await this.prisma.level.findUnique({ where: { order: dto.order } });
    if (existing) throw new ConflictException(`Level order ${dto.order} đã tồn tại`);
    return this.prisma.level.create({
      data: {
        order: dto.order,
        name: dto.name,
        expThreshold: dto.expThreshold,
        description: dto.description ?? null,
      },
    });
  }

  async updateLevel(id: string, dto: UpdateLevelDto) {
    const level = await this.prisma.level.findUnique({ where: { id } });
    if (!level) throw new NotFoundException('Không tìm thấy Level');
    return this.prisma.level.update({
      where: { id },
      data: {
        name: dto.name,
        expThreshold: dto.expThreshold,
        description: dto.description,
      },
    });
  }

  async deleteLevel(id: string) {
    const level = await this.prisma.level.findUnique({
      where: { id },
      include: { _count: { select: { profiles: true } } },
    });
    if (!level) throw new NotFoundException('Không tìm thấy Level');
    if (level._count.profiles > 0) {
      throw new ConflictException(
        `Không thể xóa — đang có ${level._count.profiles} user ở Level này.`,
      );
    }
    await this.prisma.level.delete({ where: { id } });
    return { ok: true };
  }

  // ============ EXP RULES ============
  listExpRules() {
    return this.expRules.list();
  }

  async updateExpRule(action: ExpAction, dto: UpdateExpRuleDto) {
    return this.expRules.update(action, dto);
  }

  // ============ BADGES ============
  listBadges() {
    return this.prisma.badge.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { userBadges: true } } },
    });
  }

  createBadge(dto: CreateBadgeDto) {
    return this.prisma.badge.create({
      data: {
        name: dto.name,
        icon: dto.icon,
        description: dto.description,
        rule: dto.rule as Prisma.InputJsonValue,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateBadge(id: string, dto: UpdateBadgeDto) {
    const badge = await this.prisma.badge.findUnique({ where: { id } });
    if (!badge) throw new NotFoundException('Không tìm thấy badge');
    return this.prisma.badge.update({
      where: { id },
      data: {
        name: dto.name,
        icon: dto.icon,
        description: dto.description,
        rule: dto.rule === undefined ? undefined : (dto.rule as Prisma.InputJsonValue),
        isActive: dto.isActive,
      },
    });
  }

  async deleteBadge(id: string) {
    const badge = await this.prisma.badge.findUnique({ where: { id } });
    if (!badge) throw new NotFoundException('Không tìm thấy badge');
    await this.prisma.badge.delete({ where: { id } });
    return { ok: true };
  }

  // ============ MISSIONS ============
  listMissions() {
    return this.prisma.mission.findMany({ orderBy: { createdAt: 'asc' } });
  }

  createMission(dto: CreateMissionDto) {
    return this.prisma.mission.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        rewardExp: dto.rewardExp,
        rule: dto.rule as Prisma.InputJsonValue,
        isDaily: dto.isDaily ?? true,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateMission(id: string, dto: UpdateMissionDto) {
    const m = await this.prisma.mission.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Không tìm thấy nhiệm vụ');
    return this.prisma.mission.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        rewardExp: dto.rewardExp,
        rule: dto.rule === undefined ? undefined : (dto.rule as Prisma.InputJsonValue),
        isDaily: dto.isDaily,
        isActive: dto.isActive,
      },
    });
  }

  async deleteMission(id: string) {
    const m = await this.prisma.mission.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Không tìm thấy nhiệm vụ');
    await this.prisma.mission.delete({ where: { id } });
    return { ok: true };
  }

  // ============ ADMIN USER ACTIONS ============

  // Điều chỉnh EXP thủ công (có ghi log qua exp_transactions với action ADMIN_ADJUSTMENT).
  async adjustUserExp(userId: string, dto: AdjustExpDto, actorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    if (dto.amount === 0) return { ok: true, note: 'amount=0, không thay đổi' };

    const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
    const profileBefore = await this.prisma.profile.findUnique({ where: { userId } });

    // ADMIN_ADJUSTMENT bypass ExpRules override (giữ amount nguyên gốc).
    const result = await this.gamification.addExp({
      userId,
      action: ExpAction.ADMIN_ADJUSTMENT,
      amount: dto.amount,
      refType: 'admin_adjustment',
      refId: actorId,
      note: `Admin điều chỉnh: ${dto.reason}`,
    });

    // Audit log
    await this.audit.log({
      actorId,
      actorEmail: actor?.email ?? 'unknown',
      action: 'ADJUST_EXP',
      targetType: 'USER',
      targetId: userId,
      before: { exp: profileBefore?.exp ?? 0 },
      after: { exp: result.totalExp },
      note: `${dto.amount > 0 ? '+' : ''}${dto.amount} EXP — Lý do: ${dto.reason}`,
    });

    return {
      ok: true,
      totalExp: result.totalExp,
      levelUp: result.levelUp,
      note: `Đã ${dto.amount > 0 ? 'cộng' : 'trừ'} ${Math.abs(dto.amount)} EXP`,
    };
  }

  // Mở khóa đặc cách — ghi 1 "force unlock" record vào exp_transactions làm log,
  // và tạo các bản ghi tiến độ COMPLETED tương ứng (theo targetType).
  async forceUnlock(userId: string, dto: ForceUnlockDto, actorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    // Ghi log
    await this.prisma.expTransaction.create({
      data: {
        userId,
        action: ExpAction.ADMIN_ADJUSTMENT,
        amount: 0,
        refType: `force_unlock_${dto.targetType.toLowerCase()}`,
        refId: dto.targetId,
        note: `Admin ${actorId} mở khóa đặc cách: ${dto.reason}`,
      },
    });

    // Theo targetType, mark progress là COMPLETED
    if (dto.targetType === 'LESSON') {
      await this.prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId: dto.targetId } },
        create: {
          userId,
          lessonId: dto.targetId,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
        update: { status: 'COMPLETED', completedAt: new Date() },
      });
    } else if (dto.targetType === 'MODULE') {
      const lessons = await this.prisma.lesson.findMany({
        where: { moduleId: dto.targetId },
        select: { id: true },
      });
      await this.prisma.$transaction(
        lessons.map((l) =>
          this.prisma.lessonProgress.upsert({
            where: { userId_lessonId: { userId, lessonId: l.id } },
            create: {
              userId,
              lessonId: l.id,
              status: 'COMPLETED',
              completedAt: new Date(),
            },
            update: { status: 'COMPLETED', completedAt: new Date() },
          }),
        ),
      );
    } else if (dto.targetType === 'COURSE') {
      const lessons = await this.prisma.lesson.findMany({
        where: { module: { courseId: dto.targetId } },
        select: { id: true },
      });
      await this.prisma.$transaction(
        lessons.map((l) =>
          this.prisma.lessonProgress.upsert({
            where: { userId_lessonId: { userId, lessonId: l.id } },
            create: {
              userId,
              lessonId: l.id,
              status: 'COMPLETED',
              completedAt: new Date(),
            },
            update: { status: 'COMPLETED', completedAt: new Date() },
          }),
        ),
      );
    } else if (dto.targetType === 'LEVEL') {
      // Set profile.levelId = target level. Không cộng EXP, chỉ chuyển danh hiệu.
      const level = await this.prisma.level.findUnique({ where: { id: dto.targetId } });
      if (!level) throw new NotFoundException('Không tìm thấy Level');
      await this.prisma.profile.update({
        where: { userId },
        data: { levelId: dto.targetId },
      });
    }

    // Audit log
    const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
    await this.audit.log({
      actorId,
      actorEmail: actor?.email ?? 'unknown',
      action: 'FORCE_UNLOCK',
      targetType: dto.targetType,
      targetId: dto.targetId,
      after: { userId, targetType: dto.targetType, targetId: dto.targetId },
      note: `Mở khóa đặc cách cho user ${user.email} — Lý do: ${dto.reason}`,
    });

    return { ok: true, note: 'Mở khóa thành công. Log đã ghi vào audit_logs + exp_transactions.' };
  }
}
