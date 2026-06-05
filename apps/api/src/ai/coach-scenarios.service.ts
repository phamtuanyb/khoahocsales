import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CoachScenario as DbScenario, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { COACH_SCENARIOS as DEFAULT_SCENARIOS, type CoachScenario } from './coach-scenarios';

// Service đọc/ghi kịch bản AI Coach trong DB.
// Lần đầu chạy: tự seed từ DEFAULT_SCENARIOS (4 kịch bản trong code).
// Sau đó admin có thể CRUD trong UI.
@Injectable()
export class CoachScenariosService implements OnModuleInit {
  private readonly logger = new Logger(CoachScenariosService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.ensureDefaults();
  }

  // Seed defaults idempotent.
  async ensureDefaults(): Promise<void> {
    for (const s of Object.values(DEFAULT_SCENARIOS)) {
      await this.prisma.coachScenario.upsert({
        where: { id: s.id },
        update: {},
        create: {
          id: s.id,
          name: s.name,
          description: s.description,
          icon: s.icon,
          difficulty: s.difficulty,
          systemPrompt: s.systemPrompt,
          initialMessage: s.initialMessage,
          successCriteria: s.successCriteria as unknown as Prisma.InputJsonValue,
          rewardExp: s.rewardExp,
          isActive: true,
        },
      });
    }
    this.logger.log('CoachScenarios — đã ensure defaults');
  }

  async listActive(): Promise<CoachScenario[]> {
    const rows = await this.prisma.coachScenario.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toCoachScenario);
  }

  async listAll(): Promise<CoachScenario[]> {
    const rows = await this.prisma.coachScenario.findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map(toCoachScenario);
  }

  async getOrThrow(id: string): Promise<CoachScenario> {
    const row = await this.prisma.coachScenario.findUnique({ where: { id } });
    if (!row || !row.isActive) {
      // Fallback về defaults nếu không tìm thấy trong DB (backward compat).
      const fallback = DEFAULT_SCENARIOS[id];
      if (fallback) return fallback;
      throw new NotFoundException(`Không tìm thấy kịch bản: ${id}`);
    }
    return toCoachScenario(row);
  }

  async create(data: {
    id: string;
    name: string;
    description: string;
    icon?: string;
    difficulty?: string;
    systemPrompt: string;
    initialMessage: string;
    successCriteria: string[];
    rewardExp?: number;
    isActive?: boolean;
  }): Promise<CoachScenario> {
    const created = await this.prisma.coachScenario.create({
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        icon: data.icon ?? '🎯',
        difficulty: data.difficulty ?? 'MEDIUM',
        systemPrompt: data.systemPrompt,
        initialMessage: data.initialMessage,
        successCriteria: data.successCriteria as unknown as Prisma.InputJsonValue,
        rewardExp: data.rewardExp ?? 30,
        isActive: data.isActive ?? true,
      },
    });
    return toCoachScenario(created);
  }

  async update(id: string, data: Partial<{
    name: string;
    description: string;
    icon: string;
    difficulty: string;
    systemPrompt: string;
    initialMessage: string;
    successCriteria: string[];
    rewardExp: number;
    isActive: boolean;
  }>): Promise<CoachScenario> {
    const updated = await this.prisma.coachScenario.update({
      where: { id },
      data: {
        ...data,
        successCriteria: data.successCriteria
          ? (data.successCriteria as unknown as Prisma.InputJsonValue)
          : undefined,
      },
    });
    return toCoachScenario(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.coachScenario.delete({ where: { id } });
  }
}

function toCoachScenario(row: DbScenario): CoachScenario {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    difficulty: row.difficulty as 'EASY' | 'MEDIUM' | 'HARD',
    systemPrompt: row.systemPrompt,
    initialMessage: row.initialMessage,
    successCriteria: Array.isArray(row.successCriteria)
      ? (row.successCriteria as string[])
      : [],
    rewardExp: row.rewardExp,
  };
}
