import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { SetupCharacterDto } from './dto/setup-character.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy danh sách user — admin có thể lọc theo phòng ban + search + pagination.
  async list(opts: {
    departmentId?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    data: PublicUser[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 50));

    const where: Prisma.UserWhereInput = {};
    if (opts.departmentId) where.departmentId = opts.departmentId;
    if (opts.q) {
      where.OR = [
        { email: { contains: opts.q, mode: 'insensitive' } },
        { name: { contains: opts.q, mode: 'insensitive' } },
      ];
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: { department: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: rows.map(toPublicUser),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async get(id: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { department: true },
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return toPublicUser(user);
  }

  async create(dto: CreateUserDto): Promise<PublicUser> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email đã tồn tại');
    }

    if (dto.departmentId) {
      await this.ensureDepartmentExists(dto.departmentId);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name.trim(),
        passwordHash,
        role: dto.role,
        departmentId: dto.departmentId ?? null,
        // Khởi tạo Profile rỗng — avatar null để frontend bắt onboarding
        profile: { create: { exp: 0, streakCount: 0 } },
      },
      include: { department: true },
    });
    return toPublicUser(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (dto.departmentId) {
      await this.ensureDepartmentExists(dto.departmentId);
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.password !== undefined) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    if (dto.departmentId !== undefined) {
      data.department = dto.departmentId
        ? { connect: { id: dto.departmentId } }
        : { disconnect: true };
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      include: { department: true },
    });
    return toPublicUser(updated);
  }

  // Xóa mềm — đặt status INACTIVE thay vì xóa hẳn để giữ lịch sử học tập.
  async remove(id: string): Promise<{ id: string; status: UserStatus }> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.INACTIVE },
      select: { id: true, status: true },
    });
    return updated;
  }

  // Khởi tạo nhân vật lần đầu — spec mục 5.1.
  async setupCharacter(userId: string, dto: SetupCharacterDto): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const displayName = dto.displayName.trim();
    if (displayName.length < 2) {
      throw new BadRequestException('Tên hiển thị tối thiểu 2 ký tự');
    }

    // Đảm bảo có Profile (user cũ có thể chưa có)
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: displayName,
        profile: user.profile
          ? { update: { avatar: dto.avatar } }
          : { create: { avatar: dto.avatar, exp: 0, streakCount: 0 } },
      },
      include: { department: true },
    });
    return toPublicUser(updated);
  }

  private async ensureDepartmentExists(departmentId: string): Promise<void> {
    const dept = await this.prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      throw new NotFoundException('Không tìm thấy phòng ban');
    }
  }
}

// ----- DTO trả ra (loại bỏ passwordHash) -----

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: User['role'];
  status: UserStatus;
  departmentId: string | null;
  department: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

function toPublicUser(
  user: User & { department?: { id: string; name: string } | null },
): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    departmentId: user.departmentId,
    department: user.department
      ? { id: user.department.id, name: user.department.name }
      : null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
