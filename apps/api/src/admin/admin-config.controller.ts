import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ExpAction, UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { AdminConfigService } from './admin-config.service';
import {
  AdjustExpDto,
  CreateBadgeDto,
  CreateLevelDto,
  CreateMissionDto,
  ForceUnlockDto,
  UpdateBadgeDto,
  UpdateExpRuleDto,
  UpdateLevelDto,
  UpdateMissionDto,
} from './dto/config.dto';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminConfigController {
  constructor(private readonly service: AdminConfigService) {}

  // ===== Levels =====
  @Get('levels')
  listLevels() {
    return this.service.listLevels();
  }

  @Post('levels')
  createLevel(@Body() dto: CreateLevelDto) {
    return this.service.createLevel(dto);
  }

  @Patch('levels/:id')
  updateLevel(@Param('id') id: string, @Body() dto: UpdateLevelDto) {
    return this.service.updateLevel(id, dto);
  }

  @Delete('levels/:id')
  deleteLevel(@Param('id') id: string) {
    return this.service.deleteLevel(id);
  }

  // ===== EXP Rules =====
  @Get('exp-rules')
  listExpRules() {
    return this.service.listExpRules();
  }

  @Patch('exp-rules/:action')
  updateExpRule(@Param('action') action: string, @Body() dto: UpdateExpRuleDto) {
    if (!(Object.values(ExpAction) as string[]).includes(action)) {
      throw new BadRequestException(`Action không hợp lệ: ${action}`);
    }
    return this.service.updateExpRule(action as ExpAction, dto);
  }

  // ===== Badges =====
  @Get('badges')
  listBadges() {
    return this.service.listBadges();
  }

  @Post('badges')
  createBadge(@Body() dto: CreateBadgeDto) {
    return this.service.createBadge(dto);
  }

  @Patch('badges/:id')
  updateBadge(@Param('id') id: string, @Body() dto: UpdateBadgeDto) {
    return this.service.updateBadge(id, dto);
  }

  @Delete('badges/:id')
  deleteBadge(@Param('id') id: string) {
    return this.service.deleteBadge(id);
  }

  // ===== Missions =====
  @Get('missions')
  listMissions() {
    return this.service.listMissions();
  }

  @Post('missions')
  createMission(@Body() dto: CreateMissionDto) {
    return this.service.createMission(dto);
  }

  @Patch('missions/:id')
  updateMission(@Param('id') id: string, @Body() dto: UpdateMissionDto) {
    return this.service.updateMission(id, dto);
  }

  @Delete('missions/:id')
  deleteMission(@Param('id') id: string) {
    return this.service.deleteMission(id);
  }

  // ===== User actions =====
  @Post('users/:id/adjust-exp')
  adjustExp(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') userId: string,
    @Body() dto: AdjustExpDto,
  ) {
    return this.service.adjustUserExp(userId, dto, actor.id);
  }

  @Post('users/:id/force-unlock')
  forceUnlock(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') userId: string,
    @Body() dto: ForceUnlockDto,
  ) {
    return this.service.forceUnlock(userId, dto, actor.id);
  }
}
