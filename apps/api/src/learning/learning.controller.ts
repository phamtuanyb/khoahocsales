import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { LearningService } from './learning.service';

@Controller()
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  // GET /api/v1/courses — danh sách khóa học của phòng ban user (Admin xem hết).
  @Get('courses')
  listCourses(@CurrentUser() user: AuthenticatedUser) {
    return this.learningService.listCourses(user.id);
  }

  // GET /api/v1/courses/:id — cây mô-đun + bài học kèm trạng thái mở/khóa.
  @Get('courses/:id')
  getCourse(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.learningService.getCourse(user.id, id);
  }

  // GET /api/v1/lessons/:id — nội dung chi tiết bài học.
  @Get('lessons/:id')
  getLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.learningService.getLesson(user.id, id);
  }

  // POST /api/v1/lessons/:id/complete — đánh dấu hoàn thành.
  @Post('lessons/:id/complete')
  @HttpCode(HttpStatus.OK)
  completeLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.learningService.completeLesson(user.id, id);
  }
}
