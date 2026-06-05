import {
  BadRequestException,
  Controller,
  Get,
  Post,
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
import { UsersImportService } from './users-import.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const EXCEL_MIMES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream', // một số trình duyệt gửi như này
];

@Controller('admin/users')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersImportController {
  constructor(private readonly service: UsersImportService) {}

  // GET /api/v1/admin/users/import-template — tải Excel mẫu.
  @Get('import-template')
  async template(@Res() res: Response): Promise<void> {
    const buffer = await this.service.generateTemplate();
    const filename = 'mkt-users-import-template.xlsx';
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  // POST /api/v1/admin/users/import — multipart form-data, field "file".
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
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
    return this.service.parseAndImport(file.buffer);
  }
}
