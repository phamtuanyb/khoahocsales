import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { QuestionDifficulty, QuestionType } from '@prisma/client';

export class CreateQuestionDto {
  @IsEnum(QuestionType)
  type!: QuestionType;

  @IsString() @MinLength(5)
  content!: string;

  // Cấu trúc options khác nhau theo type — Admin chịu trách nhiệm cấu trúc đúng.
  // MULTIPLE_CHOICE: [{key:'A',text:'...'}, ...]
  // MINI_GAME:       [{id:'step-1',text:'...'}, ...]
  // SITUATION/BOSS:  null
  @IsOptional()
  options?: unknown;

  // Đáp án — bắt buộc.
  // MULTIPLE_CHOICE: { correct: 'A' }
  // MINI_GAME:       { correctOrder: ['step-1', ...] }
  // SITUATION/BOSS:  { keywords: ['...'], minScore: 50, rubric: '...' }
  @IsObject()
  answer!: Record<string, unknown>;

  @IsOptional() @IsEnum(QuestionDifficulty)
  difficulty?: QuestionDifficulty;

  @IsOptional() @IsString()
  moduleId?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class UpdateQuestionDto {
  @IsOptional() @IsEnum(QuestionType)
  type?: QuestionType;

  @IsOptional() @IsString() @MinLength(5)
  content?: string;

  @IsOptional()
  options?: unknown;

  @IsOptional() @IsObject()
  answer?: Record<string, unknown>;

  @IsOptional() @IsEnum(QuestionDifficulty)
  difficulty?: QuestionDifficulty;

  @IsOptional() @IsString()
  moduleId?: string | null;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

// ===== Quiz =====
export class CreateQuizDto {
  @IsString() @MinLength(2)
  title!: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  moduleId?: string;

  // Khi gắn vào Level → trở thành Boss Battle
  @IsOptional() @IsString()
  levelId?: string;

  @IsInt() @Min(0)
  passScore!: number;

  @IsInt() @Min(30)
  timeLimitSec!: number;

  @IsInt() @Min(1)
  maxAttempts!: number;

  @IsArray() @IsString({ each: true })
  questionIds!: string[];

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class UpdateQuizDto {
  @IsOptional() @IsString() @MinLength(2)
  title?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  moduleId?: string | null;

  @IsOptional() @IsString()
  levelId?: string | null;

  @IsOptional() @IsInt() @Min(0)
  passScore?: number;

  @IsOptional() @IsInt() @Min(30)
  timeLimitSec?: number;

  @IsOptional() @IsInt() @Min(1)
  maxAttempts?: number;

  @IsOptional() @IsArray() @IsString({ each: true })
  questionIds?: string[];

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
