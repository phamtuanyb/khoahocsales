import { Injectable } from '@nestjs/common';
import { LessonStatus, QuizAttemptStatus } from '@prisma/client';
import ExcelJS from 'exceljs';
import { startOfDayVn, startOfWeekVn } from '../common/time';
import { PrismaService } from '../prisma/prisma.service';

export interface AdminOverview {
  totals: {
    users: number;
    activeToday: number;
    activeThisWeek: number;
    courses: number;
    questions: number;
    quizzes: number;
    badgesAwarded: number;
    certificatesIssued: number;
  };
  // Phân bố Level toàn công ty
  levelDistribution: Array<{ levelId: string; order: number; name: string; count: number }>;
  // Top performer (Top Học Tập all-time)
  topPerformers: Array<{
    userId: string;
    name: string;
    email: string;
    department: string | null;
    levelOrder: number;
    levelName: string | null;
    exp: number;
  }>;
  // Nhân sự không hoạt động (chưa có lastActiveAt hoặc > 7 ngày)
  inactiveUsers: Array<{
    userId: string;
    name: string;
    email: string;
    department: string | null;
    lastActiveAt: string | null;
    daysSinceActive: number | null;
  }>;
  // Tỷ lệ hoàn thành theo khóa
  courseProgress: Array<{
    courseId: string;
    title: string;
    department: string | null;
    totalLessons: number;
    totalUsers: number;
    avgCompletionPercent: number;
  }>;
  // Tỷ lệ đỗ bài thi
  quizPassRates: Array<{
    quizId: string;
    title: string;
    totalAttempts: number;
    passedAttempts: number;
    passRate: number;
    avgScore: number;
  }>;
}

function daysAgo(date: Date | null): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
}

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(): Promise<AdminOverview> {
    const today = startOfDayVn();
    const weekStart = startOfWeekVn();

    const [
      totalUsers,
      activeToday,
      activeThisWeek,
      totalCourses,
      totalQuestions,
      totalQuizzes,
      badgesAwarded,
      certsIssued,
      levels,
      profilesByLevel,
      topUsers,
      inactive,
      courses,
      quizAttempts,
    ] = await Promise.all([
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.profile.count({ where: { lastActiveAt: { gte: today } } }),
      this.prisma.profile.count({ where: { lastActiveAt: { gte: weekStart } } }),
      this.prisma.course.count(),
      this.prisma.question.count(),
      this.prisma.quiz.count(),
      this.prisma.userBadge.count(),
      this.prisma.certificate.count(),
      this.prisma.level.findMany({ orderBy: { order: 'asc' } }),
      this.prisma.profile.groupBy({
        by: ['levelId'],
        _count: { _all: true },
      }),
      this.prisma.user.findMany({
        where: { status: 'ACTIVE', profile: { isNot: null } },
        include: { profile: { include: { level: true } }, department: true },
        orderBy: { profile: { exp: 'desc' } },
        take: 10,
      }),
      this.prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { profile: { lastActiveAt: null } },
            { profile: { lastActiveAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
          ],
        },
        include: { profile: true, department: true },
        take: 50,
      }),
      this.prisma.course.findMany({
        where: { isPublished: true },
        include: {
          department: true,
          modules: { include: { lessons: { select: { id: true } } } },
        },
      }),
      this.prisma.quiz.findMany({
        include: { attempts: { select: { score: true, passed: true, status: true } } },
      }),
    ]);

    // Phân bố Level
    const levelMap = new Map(levels.map((l) => [l.id, l]));
    const levelDistribution = levels.map((l) => {
      const entry = profilesByLevel.find((p) => p.levelId === l.id);
      return {
        levelId: l.id,
        order: l.order,
        name: l.name,
        count: entry?._count._all ?? 0,
      };
    });
    // Cộng cả user chưa có levelId (null)
    const nullCount = profilesByLevel.find((p) => p.levelId === null)?._count._all ?? 0;
    if (nullCount > 0 && levels[0]) {
      const first = levelDistribution.find((l) => l.levelId === levels[0]!.id);
      if (first) first.count += nullCount;
    }

    // Top performers
    const topPerformers = topUsers.map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      department: u.department?.name ?? null,
      levelOrder: u.profile?.level?.order ?? 1,
      levelName: u.profile?.level?.name ?? null,
      exp: u.profile?.exp ?? 0,
    }));

    // Inactive users
    const inactiveUsers = inactive.map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      department: u.department?.name ?? null,
      lastActiveAt: u.profile?.lastActiveAt?.toISOString() ?? null,
      daysSinceActive: daysAgo(u.profile?.lastActiveAt ?? null),
    }));

    // Course progress
    const courseProgress: AdminOverview['courseProgress'] = [];
    for (const c of courses) {
      const lessonIds = c.modules.flatMap((m) => m.lessons.map((l) => l.id));
      if (lessonIds.length === 0) {
        courseProgress.push({
          courseId: c.id,
          title: c.title,
          department: c.department?.name ?? null,
          totalLessons: 0,
          totalUsers: 0,
          avgCompletionPercent: 0,
        });
        continue;
      }
      // Đếm user trong phòng ban có ít nhất 1 lesson completed
      const deptUserCount = await this.prisma.user.count({
        where: {
          status: 'ACTIVE',
          departmentId: c.departmentId,
        },
      });
      const totalCompletions = await this.prisma.lessonProgress.count({
        where: {
          lessonId: { in: lessonIds },
          status: LessonStatus.COMPLETED,
        },
      });
      const avg = deptUserCount > 0
        ? (totalCompletions / (deptUserCount * lessonIds.length)) * 100
        : 0;
      courseProgress.push({
        courseId: c.id,
        title: c.title,
        department: c.department?.name ?? null,
        totalLessons: lessonIds.length,
        totalUsers: deptUserCount,
        avgCompletionPercent: Math.round(avg),
      });
    }

    // Quiz pass rates
    const quizPassRates: AdminOverview['quizPassRates'] = quizAttempts.map((q) => {
      const total = q.attempts.length;
      const passed = q.attempts.filter((a) => a.passed).length;
      const avgScore = total > 0 ? q.attempts.reduce((s, a) => s + a.score, 0) / total : 0;
      return {
        quizId: q.id,
        title: q.title,
        totalAttempts: total,
        passedAttempts: passed,
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
        avgScore: Math.round(avgScore),
      };
    });

    return {
      totals: {
        users: totalUsers,
        activeToday,
        activeThisWeek,
        courses: totalCourses,
        questions: totalQuestions,
        quizzes: totalQuizzes,
        badgesAwarded,
        certificatesIssued: certsIssued,
      },
      levelDistribution,
      topPerformers,
      inactiveUsers,
      courseProgress,
      quizPassRates,
    };
  }

  // ============ EXCEL EXPORT ============

  // Xuất Excel báo cáo tổng hợp — gồm 4 sheet: Users, CourseProgress, QuizStats, Inactive.
  async exportOverviewExcel(): Promise<Buffer> {
    const data = await this.getOverview();

    const wb = new ExcelJS.Workbook();
    wb.creator = 'MKT Academy';
    wb.created = new Date();

    // Sheet 1: Tổng quan
    const sOverview = wb.addWorksheet('Tong quan');
    sOverview.columns = [
      { header: 'Chỉ số', key: 'k', width: 30 },
      { header: 'Giá trị', key: 'v', width: 20 },
    ];
    sOverview.addRows([
      { k: 'Tổng user ACTIVE', v: data.totals.users },
      { k: 'Active hôm nay', v: data.totals.activeToday },
      { k: 'Active tuần này', v: data.totals.activeThisWeek },
      { k: 'Số khóa học', v: data.totals.courses },
      { k: 'Số câu hỏi', v: data.totals.questions },
      { k: 'Số bài thi', v: data.totals.quizzes },
      { k: 'Số huy hiệu đã trao', v: data.totals.badgesAwarded },
      { k: 'Số chứng chỉ đã cấp', v: data.totals.certificatesIssued },
    ]);
    styleHeader(sOverview);

    // Sheet 2: Top Performers
    const sTop = wb.addWorksheet('Top Performers');
    sTop.columns = [
      { header: '#', key: 'rank', width: 5 },
      { header: 'Họ tên', key: 'name', width: 28 },
      { header: 'Email', key: 'email', width: 32 },
      { header: 'Phòng ban', key: 'dept', width: 16 },
      { header: 'Level', key: 'level', width: 22 },
      { header: 'EXP', key: 'exp', width: 12 },
    ];
    sTop.addRows(
      data.topPerformers.map((t, i) => ({
        rank: i + 1,
        name: t.name,
        email: t.email,
        dept: t.department ?? '—',
        level: `Lv.${t.levelOrder} ${t.levelName ?? ''}`,
        exp: t.exp,
      })),
    );
    styleHeader(sTop);

    // Sheet 3: Course Progress
    const sCourse = wb.addWorksheet('Tien do khoa hoc');
    sCourse.columns = [
      { header: 'Khóa học', key: 'title', width: 36 },
      { header: 'Phòng ban', key: 'dept', width: 16 },
      { header: 'Số bài', key: 'lessons', width: 10 },
      { header: 'Số nhân sự', key: 'users', width: 14 },
      { header: 'TB hoàn thành (%)', key: 'pct', width: 20 },
    ];
    sCourse.addRows(
      data.courseProgress.map((c) => ({
        title: c.title,
        dept: c.department ?? '—',
        lessons: c.totalLessons,
        users: c.totalUsers,
        pct: c.avgCompletionPercent,
      })),
    );
    styleHeader(sCourse);

    // Sheet 4: Quiz Stats
    const sQuiz = wb.addWorksheet('Bai thi');
    sQuiz.columns = [
      { header: 'Bài thi', key: 'title', width: 40 },
      { header: 'Tổng lượt', key: 'total', width: 12 },
      { header: 'Lượt đỗ', key: 'passed', width: 12 },
      { header: 'Tỷ lệ đỗ (%)', key: 'rate', width: 14 },
      { header: 'Điểm TB', key: 'avg', width: 12 },
    ];
    sQuiz.addRows(
      data.quizPassRates.map((q) => ({
        title: q.title,
        total: q.totalAttempts,
        passed: q.passedAttempts,
        rate: q.passRate,
        avg: q.avgScore,
      })),
    );
    styleHeader(sQuiz);

    // Sheet 5: Inactive Users (cảnh báo)
    const sInactive = wb.addWorksheet('Khong hoat dong');
    sInactive.columns = [
      { header: 'Họ tên', key: 'name', width: 28 },
      { header: 'Email', key: 'email', width: 32 },
      { header: 'Phòng ban', key: 'dept', width: 16 },
      { header: 'Lần hoạt động cuối', key: 'last', width: 24 },
      { header: 'Số ngày', key: 'days', width: 12 },
    ];
    sInactive.addRows(
      data.inactiveUsers.map((u) => ({
        name: u.name,
        email: u.email,
        dept: u.department ?? '—',
        last: u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString('vi-VN') : 'Chưa hoạt động',
        days: u.daysSinceActive ?? '—',
      })),
    );
    styleHeader(sInactive);

    // Sheet 6: Level Distribution
    const sLevel = wb.addWorksheet('Phan bo Level');
    sLevel.columns = [
      { header: 'Order', key: 'order', width: 8 },
      { header: 'Level', key: 'name', width: 24 },
      { header: 'Số user', key: 'count', width: 12 },
    ];
    sLevel.addRows(
      data.levelDistribution.map((l) => ({
        order: l.order,
        name: l.name,
        count: l.count,
      })),
    );
    styleHeader(sLevel);

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // Xuất danh sách user (tất cả) ra Excel
  async exportUsersExcel(): Promise<Buffer> {
    const users = await this.prisma.user.findMany({
      include: { profile: { include: { level: true } }, department: true },
      orderBy: { createdAt: 'desc' },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Users');
    ws.columns = [
      { header: 'ID', key: 'id', width: 24 },
      { header: 'Họ tên', key: 'name', width: 24 },
      { header: 'Email', key: 'email', width: 32 },
      { header: 'Vai trò', key: 'role', width: 12 },
      { header: 'Phòng ban', key: 'dept', width: 14 },
      { header: 'Trạng thái', key: 'status', width: 12 },
      { header: 'Level', key: 'level', width: 18 },
      { header: 'EXP', key: 'exp', width: 10 },
      { header: 'Streak', key: 'streak', width: 10 },
      { header: 'Ngày tạo', key: 'createdAt', width: 22 },
      { header: 'Hoạt động cuối', key: 'lastActive', width: 22 },
    ];
    ws.addRows(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        dept: u.department?.name ?? '—',
        status: u.status,
        level: u.profile?.level
          ? `Lv.${u.profile.level.order} ${u.profile.level.name}`
          : '—',
        exp: u.profile?.exp ?? 0,
        streak: u.profile?.streakCount ?? 0,
        createdAt: u.createdAt.toLocaleString('vi-VN'),
        lastActive: u.profile?.lastActiveAt
          ? u.profile.lastActiveAt.toLocaleString('vi-VN')
          : '—',
      })),
    );
    styleHeader(ws);
    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

function styleHeader(ws: ExcelJS.Worksheet): void {
  const row = ws.getRow(1);
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1565C0' },
  };
  row.alignment = { vertical: 'middle', horizontal: 'left' };
  row.height = 24;
  ws.views = [{ state: 'frozen', ySplit: 1 }];
}
