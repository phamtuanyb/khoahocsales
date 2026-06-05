import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateCourseDto,
  CreateDepartmentDto,
  CreateLessonDto,
  CreateModuleDto,
  UpdateCourseDto,
  UpdateDepartmentDto,
  UpdateLessonDto,
  UpdateModuleDto,
} from './dto/content.dto';

@Injectable()
export class AdminContentService {
  constructor(private readonly prisma: PrismaService) {}

  // ============ DEPARTMENTS ============
  listDepartments() {
    return this.prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { users: true, courses: true } },
      },
    });
  }

  async createDepartment(dto: CreateDepartmentDto) {
    const exists = await this.prisma.department.findUnique({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Phòng ban đã tồn tại');
    return this.prisma.department.create({ data: { name: dto.name } });
  }

  async updateDepartment(id: string, dto: UpdateDepartmentDto) {
    await this.requireDept(id);
    return this.prisma.department.update({ where: { id }, data: { name: dto.name } });
  }

  async deleteDepartment(id: string) {
    await this.requireDept(id);
    const userCount = await this.prisma.user.count({ where: { departmentId: id } });
    if (userCount > 0) {
      throw new ConflictException(
        `Không thể xóa phòng ban — còn ${userCount} nhân sự đang gán. Hãy chuyển nhân sự sang phòng khác trước.`,
      );
    }
    await this.prisma.department.delete({ where: { id } });
    return { ok: true };
  }

  // ============ COURSES ============
  listCourses() {
    return this.prisma.course.findMany({
      orderBy: { order: 'asc' },
      include: {
        department: true,
        _count: { select: { modules: true } },
      },
    });
  }

  async getCourse(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        department: true,
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: { id: true, title: true, order: true, videoUrl: true },
            },
            quizzes: { select: { id: true, title: true } },
            _count: { select: { lessons: true, questions: true } },
          },
        },
      },
    });
    if (!course) throw new NotFoundException('Không tìm thấy khóa học');
    return course;
  }

  async createCourse(dto: CreateCourseDto) {
    await this.requireDept(dto.departmentId);
    return this.prisma.course.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        departmentId: dto.departmentId,
        order: dto.order,
        unlockRule: (dto.unlockRule ?? null) as Prisma.InputJsonValue,
        isPublished: dto.isPublished ?? true,
      },
    });
  }

  async updateCourse(id: string, dto: UpdateCourseDto) {
    await this.requireCourse(id);
    if (dto.departmentId) await this.requireDept(dto.departmentId);
    return this.prisma.course.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        departmentId: dto.departmentId,
        order: dto.order,
        unlockRule:
          dto.unlockRule === undefined
            ? undefined
            : (dto.unlockRule as Prisma.InputJsonValue),
        isPublished: dto.isPublished,
      },
    });
  }

  async deleteCourse(id: string) {
    await this.requireCourse(id);
    await this.prisma.course.delete({ where: { id } });
    return { ok: true };
  }

  // ============ MODULES ============
  listModules(courseId: string) {
    return this.prisma.module.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: { _count: { select: { lessons: true } } },
    });
  }

  async createModule(dto: CreateModuleDto) {
    await this.requireCourse(dto.courseId);
    return this.prisma.module.create({
      data: {
        courseId: dto.courseId,
        title: dto.title,
        description: dto.description ?? null,
        order: dto.order,
        unlockRule: (dto.unlockRule ?? null) as Prisma.InputJsonValue,
      },
    });
  }

  async updateModule(id: string, dto: UpdateModuleDto) {
    await this.requireModule(id);
    return this.prisma.module.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        order: dto.order,
        unlockRule:
          dto.unlockRule === undefined
            ? undefined
            : (dto.unlockRule as Prisma.InputJsonValue),
      },
    });
  }

  async deleteModule(id: string) {
    await this.requireModule(id);
    await this.prisma.module.delete({ where: { id } });
    return { ok: true };
  }

  async reorderModules(courseId: string, orderedIds: string[]) {
    await this.requireCourse(courseId);
    // Cập nhật từng module với order mới — trong 1 transaction
    await this.prisma.$transaction(
      orderedIds.map((id, idx) =>
        this.prisma.module.update({
          where: { id },
          data: { order: idx + 1 },
        }),
      ),
    );
    return this.listModules(courseId);
  }

  // ============ LESSONS ============
  listLessons(moduleId: string) {
    return this.prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
    });
  }

  async getLesson(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { module: { include: { course: true } } },
    });
    if (!lesson) throw new NotFoundException('Không tìm thấy bài học');
    return lesson;
  }

  async createLesson(dto: CreateLessonDto) {
    await this.requireModule(dto.moduleId);
    return this.prisma.lesson.create({
      data: {
        moduleId: dto.moduleId,
        title: dto.title,
        content: dto.content,
        videoUrl: dto.videoUrl ?? null,
        order: dto.order,
      },
    });
  }

  async updateLesson(id: string, dto: UpdateLessonDto) {
    await this.requireLesson(id);
    return this.prisma.lesson.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        videoUrl: dto.videoUrl === undefined ? undefined : dto.videoUrl,
        order: dto.order,
      },
    });
  }

  async deleteLesson(id: string) {
    await this.requireLesson(id);
    await this.prisma.lesson.delete({ where: { id } });
    return { ok: true };
  }

  async reorderLessons(moduleId: string, orderedIds: string[]) {
    await this.requireModule(moduleId);
    await this.prisma.$transaction(
      orderedIds.map((id, idx) =>
        this.prisma.lesson.update({
          where: { id },
          data: { order: idx + 1 },
        }),
      ),
    );
    return this.listLessons(moduleId);
  }

  // ============ helpers ============
  private async requireDept(id: string) {
    const d = await this.prisma.department.findUnique({ where: { id } });
    if (!d) throw new NotFoundException('Không tìm thấy phòng ban');
    return d;
  }
  private async requireCourse(id: string) {
    const c = await this.prisma.course.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Không tìm thấy khóa học');
    return c;
  }
  private async requireModule(id: string) {
    const m = await this.prisma.module.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Không tìm thấy mô-đun');
    return m;
  }
  private async requireLesson(id: string) {
    const l = await this.prisma.lesson.findUnique({ where: { id } });
    if (!l) throw new NotFoundException('Không tìm thấy bài học');
    return l;
  }
}
