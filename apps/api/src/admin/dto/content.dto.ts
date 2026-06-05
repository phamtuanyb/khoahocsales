import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

// ===== Course =====
export class CreateCourseDto {
  @IsString() @MinLength(2) @MaxLength(200)
  title!: string;

  @IsOptional() @IsString() @MaxLength(1000)
  description?: string;

  @IsString()
  departmentId!: string;

  @IsInt() @Min(0)
  order!: number;

  @IsOptional() @IsObject()
  unlockRule?: Record<string, unknown>;

  @IsOptional() @IsBoolean()
  isPublished?: boolean;
}

export class UpdateCourseDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200)
  title?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  description?: string;

  @IsOptional() @IsString()
  departmentId?: string;

  @IsOptional() @IsInt() @Min(0)
  order?: number;

  @IsOptional() @IsObject()
  unlockRule?: Record<string, unknown>;

  @IsOptional() @IsBoolean()
  isPublished?: boolean;
}

// ===== Module =====
export class CreateModuleDto {
  @IsString()
  courseId!: string;

  @IsString() @MinLength(2) @MaxLength(200)
  title!: string;

  @IsOptional() @IsString() @MaxLength(500)
  description?: string;

  @IsInt() @Min(0)
  order!: number;

  @IsOptional() @IsObject()
  unlockRule?: Record<string, unknown>;
}

export class UpdateModuleDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200)
  title?: string;

  @IsOptional() @IsString() @MaxLength(500)
  description?: string;

  @IsOptional() @IsInt() @Min(0)
  order?: number;

  @IsOptional() @IsObject()
  unlockRule?: Record<string, unknown>;
}

// ===== Lesson =====
export class CreateLessonDto {
  @IsString()
  moduleId!: string;

  @IsString() @MinLength(2) @MaxLength(200)
  title!: string;

  @IsString() @MinLength(1)
  content!: string;

  @IsOptional() @IsString()
  videoUrl?: string;

  @IsInt() @Min(0)
  order!: number;
}

export class UpdateLessonDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200)
  title?: string;

  @IsOptional() @IsString() @MinLength(1)
  content?: string;

  @IsOptional() @IsString()
  videoUrl?: string | null;

  @IsOptional() @IsInt() @Min(0)
  order?: number;
}

// ===== Department =====
export class CreateDepartmentDto {
  @IsString() @MinLength(2) @MaxLength(100)
  name!: string;
}

export class UpdateDepartmentDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100)
  name?: string;
}
