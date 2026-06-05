import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // GET /api/v1/profile/dashboard — toàn bộ data cho Dashboard cá nhân (spec 5.2).
  @Get('dashboard')
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getDashboard(user.id);
  }
}
