import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { BadgeService } from './badge.service';

@Controller('badges')
export class BadgeController {
  constructor(private readonly badgeService: BadgeService) {}

  // GET /api/v1/badges — danh sách badge của user (cả đã đạt và chưa).
  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.badgeService.listForUser(user.id);
  }
}
