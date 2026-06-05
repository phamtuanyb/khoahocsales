import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { MissionService } from './mission.service';

@Controller('missions')
export class MissionController {
  constructor(private readonly missionService: MissionService) {}

  // GET /api/v1/missions/today — nhiệm vụ ngày của user (kèm progress).
  // Side-effect: tự đánh dấu completed nếu điều kiện đã đạt.
  // EXP thưởng được cộng qua cascade trong GamificationService (gọi từ event sites).
  @Get('today')
  async today(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.missionService.evaluateToday(user.id);
    return result.all;
  }

  // POST /api/v1/missions/refresh — buộc re-check (FE bấm nút làm mới).
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.missionService.evaluateToday(user.id);
    return result.all;
  }
}
