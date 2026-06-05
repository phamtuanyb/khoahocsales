import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ExpAction } from '@prisma/client';

// ===== Level =====
export class CreateLevelDto {
  @IsInt() @Min(1)
  order!: number;

  @IsString() @MinLength(2)
  name!: string;

  @IsInt() @Min(0)
  expThreshold!: number;

  @IsOptional() @IsString()
  description?: string;
}

export class UpdateLevelDto {
  @IsOptional() @IsString() @MinLength(2)
  name?: string;

  @IsOptional() @IsInt() @Min(0)
  expThreshold?: number;

  @IsOptional() @IsString()
  description?: string | null;
}

// ===== ExpRule =====
export class UpdateExpRuleDto {
  @IsOptional() @IsInt() @Min(0)
  amount?: number;

  @IsOptional() @IsBoolean()
  enabled?: boolean;

  @IsOptional() @IsString()
  description?: string;
}

// ===== Badge =====
export class CreateBadgeDto {
  @IsString() @MinLength(2)
  name!: string;

  @IsString() @MinLength(1)
  icon!: string;

  @IsString()
  description!: string;

  @IsObject()
  rule!: Record<string, unknown>;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class UpdateBadgeDto {
  @IsOptional() @IsString() @MinLength(2)
  name?: string;

  @IsOptional() @IsString() @MinLength(1)
  icon?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsObject()
  rule?: Record<string, unknown>;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

// ===== Mission =====
export class CreateMissionDto {
  @IsString() @MinLength(2)
  title!: string;

  @IsOptional() @IsString()
  description?: string;

  @IsInt() @Min(0)
  rewardExp!: number;

  @IsObject()
  rule!: Record<string, unknown>;

  @IsOptional() @IsBoolean()
  isDaily?: boolean;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class UpdateMissionDto {
  @IsOptional() @IsString() @MinLength(2)
  title?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsInt() @Min(0)
  rewardExp?: number;

  @IsOptional() @IsObject()
  rule?: Record<string, unknown>;

  @IsOptional() @IsBoolean()
  isDaily?: boolean;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

// ===== Admin user actions =====
export class AdjustExpDto {
  @IsInt()
  amount!: number; // Có thể âm để trừ

  @IsString() @MinLength(3)
  reason!: string;
}

export class ForceUnlockDto {
  @IsEnum(['LESSON', 'MODULE', 'COURSE', 'LEVEL'] as const)
  targetType!: 'LESSON' | 'MODULE' | 'COURSE' | 'LEVEL';

  @IsString()
  targetId!: string;

  @IsString() @MinLength(3)
  reason!: string;
}

// Helper kiểu — chỉ để giữ chỗ; class-validator không validate được type này.
export type ExpActionKey = keyof typeof ExpAction;
