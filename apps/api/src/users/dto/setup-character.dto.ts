import { IsString, MaxLength, MinLength } from 'class-validator';

// Dữ liệu khởi tạo nhân vật lần đầu (spec mục 5.1).
export class SetupCharacterDto {
  @IsString()
  @MinLength(2, { message: 'Tên hiển thị tối thiểu 2 ký tự' })
  @MaxLength(50, { message: 'Tên hiển thị tối đa 50 ký tự' })
  displayName!: string;

  // Key của bộ avatar dựng sẵn (VD: 'warrior-blue', 'sales-pro-1', ...)
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  avatar!: string;
}
