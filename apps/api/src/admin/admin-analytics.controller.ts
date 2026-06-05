import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminAnalyticsService } from './admin-analytics.service';

@Controller('admin/analytics')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminAnalyticsController {
  constructor(private readonly service: AdminAnalyticsService) {}

  // GET /admin/analytics/overview — toàn bộ số liệu JSON cho FE chart.
  @Get('overview')
  overview() {
    return this.service.getOverview();
  }

  // GET /admin/analytics/export/overview — file Excel 6 sheet.
  @Get('export/overview')
  async exportOverview(@Res() res: Response): Promise<void> {
    const buffer = await this.service.exportOverviewExcel();
    const filename = `mkt-academy-overview-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  // GET /admin/analytics/export/users — danh sách user
  @Get('export/users')
  async exportUsers(@Res() res: Response): Promise<void> {
    const buffer = await this.service.exportUsersExcel();
    const filename = `mkt-academy-users-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
