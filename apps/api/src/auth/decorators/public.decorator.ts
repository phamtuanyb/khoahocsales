import { SetMetadata } from '@nestjs/common';

// Đánh dấu route công khai (bỏ qua JwtAuthGuard toàn cục).
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
