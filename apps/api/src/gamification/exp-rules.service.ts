import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ExpAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Mặc định gốc — fallback khi DB chưa có rule cho action đó.
// Khớp với spec mục 5.5.
export const DEFAULT_EXP_RULES: Record<ExpAction, { amount: number; description: string }> = {
  LESSON_COMPLETED: { amount: 10, description: 'Hoàn thành 1 bài học' },
  QUIZ_CORRECT_ANSWER: { amount: 20, description: 'Trả lời đúng 1 câu trong bài thi' },
  COURSE_COMPLETED: { amount: 100, description: 'Hoàn thành 1 khóa học' },
  DAILY_LOGIN_STREAK: { amount: 5, description: 'Đăng nhập học liên tục mỗi ngày' },
  TEAM_SUPPORT: { amount: 15, description: 'Hỗ trợ đồng đội (Manager/Admin xác nhận)' },
  BOSS_BATTLE_PASSED: { amount: 200, description: 'Vượt Boss Battle (bonus)' },
  AI_COACH_SESSION: { amount: 30, description: 'EXP thưởng tối đa khi luyện AI Coach' },
  MISSION_COMPLETED: { amount: 10, description: 'Hoàn thành nhiệm vụ ngày' },
  ADMIN_ADJUSTMENT: { amount: 0, description: 'Admin điều chỉnh thủ công' },
};

@Injectable()
export class ExpRulesService implements OnModuleInit {
  private readonly logger = new Logger(ExpRulesService.name);
  // Cache trong RAM — invalidate khi admin sửa rule.
  private readonly cache = new Map<ExpAction, number>();
  private cacheLoaded = false;

  constructor(private readonly prisma: PrismaService) {}

  // Khi server khởi động: đảm bảo có default rules trong DB (idempotent).
  async onModuleInit(): Promise<void> {
    await this.ensureDefaults();
    await this.refresh();
  }

  // Tạo các rule mặc định nếu chưa có — không ghi đè giá trị admin đã chỉnh.
  async ensureDefaults(): Promise<void> {
    for (const action of Object.keys(DEFAULT_EXP_RULES) as ExpAction[]) {
      const def = DEFAULT_EXP_RULES[action];
      await this.prisma.expRule.upsert({
        where: { action },
        update: {},
        create: { action, amount: def.amount, description: def.description, enabled: true },
      });
    }
  }

  // Lấy số EXP cho 1 action. Trả về null nếu rule disabled (caller có thể bỏ qua).
  async getAmount(action: ExpAction): Promise<number | null> {
    if (!this.cacheLoaded) await this.refresh();
    return this.cache.has(action) ? this.cache.get(action)! : DEFAULT_EXP_RULES[action]?.amount ?? null;
  }

  // Load lại cache từ DB.
  async refresh(): Promise<void> {
    const rules = await this.prisma.expRule.findMany();
    this.cache.clear();
    for (const r of rules) {
      if (r.enabled) this.cache.set(r.action, r.amount);
    }
    this.cacheLoaded = true;
    this.logger.debug(`Đã load ${this.cache.size} rule EXP`);
  }

  async list() {
    const rules = await this.prisma.expRule.findMany({ orderBy: { action: 'asc' } });
    return rules.map((r) => ({
      ...r,
      defaultAmount: DEFAULT_EXP_RULES[r.action]?.amount ?? 0,
    }));
  }

  async update(action: ExpAction, data: { amount?: number; enabled?: boolean; description?: string }) {
    const updated = await this.prisma.expRule.upsert({
      where: { action },
      create: {
        action,
        amount: data.amount ?? DEFAULT_EXP_RULES[action]?.amount ?? 0,
        enabled: data.enabled ?? true,
        description: data.description ?? DEFAULT_EXP_RULES[action]?.description ?? null,
      },
      update: {
        amount: data.amount,
        enabled: data.enabled,
        description: data.description,
      },
    });
    await this.refresh();
    return updated;
  }
}
