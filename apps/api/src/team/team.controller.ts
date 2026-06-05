import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { TeamService } from './team.service';

@Controller('team')
@UseGuards(RolesGuard)
@Roles(UserRole.MANAGER, UserRole.ADMIN)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  // GET /api/v1/team/overview — Manager xem phòng mình, Admin có thể filter phòng.
  @Get('overview')
  overview(
    @CurrentUser() user: AuthenticatedUser,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.teamService.getOverview(user.id, departmentId);
  }
}
