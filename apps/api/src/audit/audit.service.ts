import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEvent {
  actorId: string;
  actorEmail: string;
  action: string;
  targetType?: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
  note?: string;
  ip?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Ghi log an toàn — không bao giờ throw để tránh phá vỡ business action.
  async log(event: AuditEvent): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: event.actorId,
          actorEmail: event.actorEmail,
          action: event.action,
          targetType: event.targetType ?? null,
          targetId: event.targetId ?? null,
          before: (event.before ?? null) as Prisma.InputJsonValue,
          after: (event.after ?? null) as Prisma.InputJsonValue,
          note: event.note ?? null,
          ip: event.ip ?? null,
        },
      });
    } catch (err) {
      this.logger.error(
        `Không ghi được audit log cho action ${event.action}`,
        err as Error,
      );
    }
  }

  // Liệt kê log (admin xem trong UI). Cursor-based pagination cho lớn.
  async list(params: {
    page?: number;
    pageSize?: number;
    actorId?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 50));

    const where: Prisma.AuditLogWhereInput = {};
    if (params.actorId) where.actorId = params.actorId;
    if (params.action) where.action = params.action;
    if (params.targetType) where.targetType = params.targetType;
    if (params.targetId) where.targetId = params.targetId;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
