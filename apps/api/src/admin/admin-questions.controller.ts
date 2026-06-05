import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminQuestionsService } from './admin-questions.service';
import { QuestionsImportService } from './questions-import.service';
import {
  CreateQuestionDto,
  CreateQuizDto,
  UpdateQuestionDto,
  UpdateQuizDto,
} from './dto/question.dto';

const EXCEL_MAX = 5 * 1024 * 1024;
const EXCEL_MIMES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream',
];

@Controller('admin')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminQuestionsController {
  constructor(
    private readonly service: AdminQuestionsService,
    private readonly importService: QuestionsImportService,
  ) {}

  // ===== Import từ Excel =====
  // ĐẶT TRƯỚC route /questions/:id để Nest match đúng path "/questions/import-*".
  @Get('questions/import-template')
  async importTemplate(@Res() res: Response): Promise<void> {
    const buf = await this.importService.generateTemplate();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="mkt-questions-template.xlsx"');
    res.send(buf);
  }

  @Post('questions/import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: EXCEL_MAX },
      fileFilter: (_req, file, cb) => {
        const okExt = /\.xlsx$/i.test(file.originalname);
        const okMime = EXCEL_MIMES.includes(file.mimetype);
        if (!okExt && !okMime) {
          cb(new BadRequestException('Chỉ chấp nhận file .xlsx'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async import(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Thiếu file');
    }
    return this.importService.parseAndImport(file.buffer);
  }

  // ===== Questions =====
  @Get('questions')
  list(
    @Query('type') type?: string,
    @Query('moduleId') moduleId?: string,
    @Query('q') q?: string,
  ) {
    return this.service.listQuestions({ type, moduleId, q });
  }

  @Get('questions/:id')
  get(@Param('id') id: string) {
    return this.service.getQuestion(id);
  }

  @Post('questions')
  create(@Body() dto: CreateQuestionDto) {
    return this.service.createQuestion(dto);
  }

  @Patch('questions/:id')
  update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.service.updateQuestion(id, dto);
  }

  @Delete('questions/:id')
  delete(@Param('id') id: string) {
    return this.service.deleteQuestion(id);
  }

  // ===== Quizzes =====
  @Get('quizzes')
  listQuizzes(
    @Query('moduleId') moduleId?: string,
    @Query('levelId') levelId?: string,
  ) {
    return this.service.listQuizzes({ moduleId, levelId });
  }

  @Get('quizzes/:id')
  getQuiz(@Param('id') id: string) {
    return this.service.getQuiz(id);
  }

  @Post('quizzes')
  createQuiz(@Body() dto: CreateQuizDto) {
    return this.service.createQuiz(dto);
  }

  @Patch('quizzes/:id')
  updateQuiz(@Param('id') id: string, @Body() dto: UpdateQuizDto) {
    return this.service.updateQuiz(id, dto);
  }

  @Delete('quizzes/:id')
  deleteQuiz(@Param('id') id: string) {
    return this.service.deleteQuiz(id);
  }
}
