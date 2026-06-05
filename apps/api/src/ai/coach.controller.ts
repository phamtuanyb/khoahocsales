import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { CoachService } from './coach.service';
import { CreateCoachSessionDto, SendCoachMessageDto } from './coach.dto';

@Controller('ai-coach')
export class CoachController {
  constructor(private readonly coach: CoachService) {}

  // Danh sách kịch bản — public-after-login (mọi user xem được).
  @Get('scenarios')
  scenarios() {
    return this.coach.listScenarios();
  }

  // Lịch sử phiên của user
  @Get('sessions')
  history(@CurrentUser() user: AuthenticatedUser) {
    return this.coach.listSessions(user.id);
  }

  @Post('session')
  @HttpCode(HttpStatus.CREATED)
  createSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCoachSessionDto,
  ) {
    return this.coach.createSession(user.id, dto.scenario);
  }

  @Get('session/:id')
  getSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.coach.getSession(user.id, id);
  }

  @Post('session/:id/message')
  @HttpCode(HttpStatus.OK)
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SendCoachMessageDto,
  ) {
    return this.coach.sendMessage(user.id, id, dto.content);
  }

  @Post('session/:id/finish')
  @HttpCode(HttpStatus.OK)
  finishSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.coach.finishSession(user.id, id);
  }
}
