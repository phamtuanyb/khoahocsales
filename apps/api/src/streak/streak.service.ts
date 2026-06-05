import { Injectable } from '@nestjs/common';
import { startOfDayVn } from '../common/time';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StreakService {
  constructor(private readonly prisma: PrismaService) {}

  // Gọi sau mỗi sự kiện học/quiz/mission để cập nhật chuỗi ngày.
  // Trả về streak mới + có "lên streak" hay không (FE có thể animate lửa).
  async touch(userId: string): Promise<{ streakCount: number; increased: boolean }> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) return { streakCount: 0, increased: false };

    const today = startOfDayVn();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastActiveDay = profile.lastActiveAt
      ? startOfDayVn(profile.lastActiveAt)
      : null;

    let newStreak = profile.streakCount;
    let increased = false;

    if (!lastActiveDay || lastActiveDay.getTime() < yesterday.getTime()) {
      // Đứt chuỗi (hoặc lần đầu) → reset về 1.
      newStreak = 1;
      increased = profile.streakCount !== 1;
    } else if (lastActiveDay.getTime() === yesterday.getTime()) {
      // Ngày kế tiếp → tăng streak.
      newStreak = profile.streakCount + 1;
      increased = true;
    }
    // Nếu lastActiveDay === today: không đổi.

    await this.prisma.profile.update({
      where: { userId },
      data: { streakCount: newStreak, lastActiveAt: new Date() },
    });

    return { streakCount: newStreak, increased };
  }
}
