import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

// Decorator phân quyền theo ma trận spec mục 2.2.
// Dùng kết hợp với RolesGuard. VD: @Roles(UserRole.ADMIN)
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
