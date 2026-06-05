import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { SetupCharacterDto } from './dto/setup-character.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Endpoint "khởi tạo nhân vật lần đầu" — mọi user đã đăng nhập đều gọi được.
  // Đặt TRƯỚC route @Get(':id') để Nest match đúng "me/setup-character".
  @Patch('me/setup-character')
  setupCharacter(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetupCharacterDto,
  ) {
    return this.usersService.setupCharacter(user.id, dto);
  }

  // ===== Khu vực Admin (ma trận spec 2.2: "Quản lý tài khoản người dùng" chỉ Admin) =====

  @Get()
  @Roles(UserRole.ADMIN)
  list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe) pageSize: number,
    @Query('departmentId') departmentId?: string,
    @Query('q') q?: string,
  ) {
    return this.usersService.list({ departmentId, q, page, pageSize });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  get(@Param('id') id: string) {
    return this.usersService.get(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
