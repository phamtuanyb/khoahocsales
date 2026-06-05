import { Injectable, NotFoundException } from '@nestjs/common';
import { Certificate, CertificateType, LessonStatus } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface CertificateView {
  id: string;
  type: CertificateType;
  code: string;
  issuedAt: string;
  title: string;
  subtitle: string;
  recipientName: string;
  refId: string;
}

function genCode(): string {
  // Mã xác thực public: MKT-XXXX-XXXX (8 ký tự hex)
  const a = randomBytes(2).toString('hex').toUpperCase();
  const b = randomBytes(2).toString('hex').toUpperCase();
  return `MKT-${a}-${b}`;
}

@Injectable()
export class CertificateService {
  constructor(private readonly prisma: PrismaService) {}

  // Kiểm tra & cấp chứng chỉ tự động sau mỗi sự kiện EXP.
  // Hai loại: LEVEL (đỗ Boss Battle) và COURSE (hoàn thành 100% bài học khóa).
  async checkAndIssue(userId: string): Promise<Certificate[]> {
    const newCerts: Certificate[] = [];

    // ---- 1) LEVEL certs ----
    const passedBosses = await this.prisma.quizAttempt.findMany({
      where: {
        userId,
        passed: true,
        quiz: { levelId: { not: null } },
      },
      include: { quiz: { include: { level: true } } },
      distinct: ['quizId'],
    });
    const passedLevelIds = new Set(
      passedBosses
        .map((a) => a.quiz.level?.id)
        .filter((id): id is string => Boolean(id)),
    );

    for (const levelId of passedLevelIds) {
      const existing = await this.prisma.certificate.findFirst({
        where: { userId, type: CertificateType.LEVEL, refId: levelId },
      });
      if (existing) continue;
      const cert = await this.prisma.certificate.create({
        data: { userId, type: CertificateType.LEVEL, refId: levelId, code: genCode() },
      });
      newCerts.push(cert);
    }

    // ---- 2) COURSE certs ----
    // Đạt 100% bài học trong khóa = đủ điều kiện cấp.
    const courses = await this.prisma.course.findMany({
      where: { isPublished: true },
      include: {
        modules: { include: { lessons: { select: { id: true } } } },
      },
    });
    for (const course of courses) {
      const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
      if (lessonIds.length === 0) continue;
      const completed = await this.prisma.lessonProgress.count({
        where: {
          userId,
          lessonId: { in: lessonIds },
          status: LessonStatus.COMPLETED,
        },
      });
      if (completed < lessonIds.length) continue;

      const existing = await this.prisma.certificate.findFirst({
        where: { userId, type: CertificateType.COURSE, refId: course.id },
      });
      if (existing) continue;

      const cert = await this.prisma.certificate.create({
        data: { userId, type: CertificateType.COURSE, refId: course.id, code: genCode() },
      });
      newCerts.push(cert);
    }

    return newCerts;
  }

  async listForUser(userId: string): Promise<CertificateView[]> {
    const certs = await this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
      include: { user: { select: { name: true } } },
    });
    return Promise.all(certs.map((c) => this.toView(c, c.user.name)));
  }

  async getById(userId: string, certId: string): Promise<CertificateView> {
    const cert = await this.prisma.certificate.findUnique({
      where: { id: certId },
      include: { user: { select: { name: true, id: true } } },
    });
    if (!cert) throw new NotFoundException('Không tìm thấy chứng chỉ');
    // Chỉ chủ sở hữu xem được (có thể mở public verification sau).
    if (cert.user.id !== userId) {
      throw new NotFoundException('Không tìm thấy chứng chỉ');
    }
    return this.toView(cert, cert.user.name);
  }

  // Tra cứu công khai bằng code (không cần đăng nhập — Sprint 7 sẽ làm public route).
  async verifyByCode(code: string): Promise<CertificateView | null> {
    const cert = await this.prisma.certificate.findUnique({
      where: { code },
      include: { user: { select: { name: true } } },
    });
    if (!cert) return null;
    return this.toView(cert, cert.user.name);
  }

  private async toView(
    cert: Certificate,
    recipientName: string,
  ): Promise<CertificateView> {
    let title = '';
    let subtitle = '';
    if (cert.type === CertificateType.LEVEL) {
      const level = await this.prisma.level.findUnique({ where: { id: cert.refId } });
      title = level?.name ?? 'Level';
      subtitle = `Đạt danh hiệu Level ${level?.order ?? '?'} — ${level?.name ?? ''}`;
    } else {
      const course = await this.prisma.course.findUnique({ where: { id: cert.refId } });
      title = course?.title ?? 'Khóa học';
      subtitle = `Hoàn thành khóa: ${course?.title ?? ''}`;
    }
    return {
      id: cert.id,
      type: cert.type,
      code: cert.code,
      issuedAt: cert.issuedAt.toISOString(),
      title,
      subtitle,
      recipientName,
      refId: cert.refId,
    };
  }
}
