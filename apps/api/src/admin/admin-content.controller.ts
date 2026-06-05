import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminContentService } from './admin-content.service';
import {
  CreateCourseDto,
  CreateDepartmentDto,
  CreateLessonDto,
  CreateModuleDto,
  UpdateCourseDto,
  UpdateDepartmentDto,
  UpdateLessonDto,
  UpdateModuleDto,
} from './dto/content.dto';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminContentController {
  constructor(private readonly content: AdminContentService) {}

  // ===== Departments =====
  @Get('departments')
  listDepartments() {
    return this.content.listDepartments();
  }

  @Post('departments')
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.content.createDepartment(dto);
  }

  @Patch('departments/:id')
  updateDepartment(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.content.updateDepartment(id, dto);
  }

  @Delete('departments/:id')
  deleteDepartment(@Param('id') id: string) {
    return this.content.deleteDepartment(id);
  }

  // ===== Courses =====
  @Get('courses')
  listCourses() {
    return this.content.listCourses();
  }

  @Get('courses/:id')
  getCourse(@Param('id') id: string) {
    return this.content.getCourse(id);
  }

  @Post('courses')
  createCourse(@Body() dto: CreateCourseDto) {
    return this.content.createCourse(dto);
  }

  @Patch('courses/:id')
  updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.content.updateCourse(id, dto);
  }

  @Delete('courses/:id')
  deleteCourse(@Param('id') id: string) {
    return this.content.deleteCourse(id);
  }

  // ===== Modules =====
  @Get('modules')
  listModules(@Query('courseId') courseId: string) {
    return this.content.listModules(courseId);
  }

  @Post('modules')
  createModule(@Body() dto: CreateModuleDto) {
    return this.content.createModule(dto);
  }

  @Patch('modules/:id')
  updateModule(@Param('id') id: string, @Body() dto: UpdateModuleDto) {
    return this.content.updateModule(id, dto);
  }

  @Delete('modules/:id')
  deleteModule(@Param('id') id: string) {
    return this.content.deleteModule(id);
  }

  @Patch('courses/:courseId/modules/reorder')
  reorderModules(
    @Param('courseId') courseId: string,
    @Body() body: { orderedIds: string[] },
  ) {
    return this.content.reorderModules(courseId, body.orderedIds);
  }

  // ===== Lessons =====
  @Get('lessons')
  listLessons(@Query('moduleId') moduleId: string) {
    return this.content.listLessons(moduleId);
  }

  @Get('lessons/:id')
  getLesson(@Param('id') id: string) {
    return this.content.getLesson(id);
  }

  @Post('lessons')
  createLesson(@Body() dto: CreateLessonDto) {
    return this.content.createLesson(dto);
  }

  @Patch('lessons/:id')
  updateLesson(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.content.updateLesson(id, dto);
  }

  @Delete('lessons/:id')
  deleteLesson(@Param('id') id: string) {
    return this.content.deleteLesson(id);
  }

  @Patch('modules/:moduleId/lessons/reorder')
  reorderLessons(
    @Param('moduleId') moduleId: string,
    @Body() body: { orderedIds: string[] },
  ) {
    return this.content.reorderLessons(moduleId, body.orderedIds);
  }
}
