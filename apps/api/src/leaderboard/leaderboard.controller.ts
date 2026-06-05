import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { LeaderboardPeriod, LeaderboardType } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  // GET /api/v1/leaderboard?boardType=TOP_LEARNING&period=WEEKLY&limit=50
  @Get()
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Query('boardType') boardTypeRaw?: string,
    @Query('period') periodRaw?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    const boardType = parseBoardType(boardTypeRaw) ?? LeaderboardType.TOP_LEARNING;
    const period = parsePeriod(periodRaw) ?? LeaderboardPeriod.WEEKLY;
    const clampedLimit = Math.min(Math.max(limit ?? 50, 5), 100);
    return this.leaderboardService.get(boardType, period, user.id, clampedLimit);
  }
}

function parseBoardType(s?: string): LeaderboardType | null {
  if (!s) return null;
  const v = s.toUpperCase();
  if ((Object.values(LeaderboardType) as string[]).includes(v)) {
    return v as LeaderboardType;
  }
  throw new BadRequestException(`boardType không hợp lệ: ${s}`);
}

function parsePeriod(s?: string): LeaderboardPeriod | null {
  if (!s) return null;
  const v = s.toUpperCase();
  if ((Object.values(LeaderboardPeriod) as string[]).includes(v)) {
    return v as LeaderboardPeriod;
  }
  throw new BadRequestException(`period không hợp lệ: ${s}`);
}
