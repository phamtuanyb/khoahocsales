import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AiSettingsService } from './ai-settings.service';
import { CoachScenariosService } from './coach-scenarios.service';

class CreateScenarioDto {
  @IsString() @MinLength(2)
  id!: string;

  @IsString() @MinLength(2)
  name!: string;

  @IsString() @MinLength(2)
  description!: string;

  @IsOptional() @IsString()
  icon?: string;

  @IsOptional() @IsIn(['EASY', 'MEDIUM', 'HARD'])
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';

  @IsString() @MinLength(20)
  systemPrompt!: string;

  @IsString() @MinLength(5)
  initialMessage!: string;

  @IsArray() @IsString({ each: true })
  successCriteria!: string[];

  @IsOptional() @IsInt() @Min(0)
  rewardExp?: number;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

class UpdateScenarioDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() @MinLength(2) description?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsIn(['EASY', 'MEDIUM', 'HARD']) difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  @IsOptional() @IsString() @MinLength(20) systemPrompt?: string;
  @IsOptional() @IsString() @MinLength(5) initialMessage?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) successCriteria?: string[];
  @IsOptional() @IsInt() @Min(0) rewardExp?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class UpdateAiSettingsDto {
  @IsOptional() @IsString() @MinLength(20)
  apiKey?: string;

  @IsOptional() @IsString() @MinLength(20)
  geminiApiKey?: string;

  @IsOptional() @IsBoolean()
  clearApiKey?: boolean;

  @IsOptional() @IsBoolean()
  clearGeminiApiKey?: boolean;

  @IsOptional() @IsIn(['openai', 'gemini'])
  coachProvider?: 'openai' | 'gemini';

  @IsOptional() @IsString() @MinLength(3)
  coachModel?: string;

  @IsOptional() @IsIn(['openai', 'gemini'])
  gradingProvider?: 'openai' | 'gemini';

  @IsOptional() @IsString() @MinLength(3)
  gradingModel?: string;

  @IsOptional() @IsInt() @Min(100) @Max(8000)
  maxTokens?: number;

  @IsOptional() @IsInt() @Min(1) @Max(1000)
  dailyLimit?: number;
}

@Controller('admin/coach-scenarios')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCoachController {
  constructor(
    private readonly scenarios: CoachScenariosService,
    private readonly aiSettings: AiSettingsService,
  ) {}

  @Get('settings')
  settings() {
    return this.aiSettings.getStatus();
  }

  @Patch('settings')
  updateSettings(@Body() dto: UpdateAiSettingsDto) {
    return this.aiSettings.update(dto);
  }

  @Get()
  list() {
    return this.scenarios.listAll();
  }

  @Post()
  create(@Body() dto: CreateScenarioDto) {
    return this.scenarios.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateScenarioDto) {
    return this.scenarios.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.scenarios.delete(id);
    return { ok: true };
  }
}
