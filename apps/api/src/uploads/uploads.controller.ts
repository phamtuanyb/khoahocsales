import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { diskStorage } from 'multer';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

// Thư mục lưu file local (mặc định: uploads/ ở root project).
// Production nên đổi sang S3/Cloudinary — chỉ cần thay diskStorage bằng s3Storage.
const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? (process.env.VERCEL ? '/tmp/uploads' : './uploads');
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB — đủ cho video bài giảng

const ALLOWED_TYPES =
  /^(image\/(png|jpe?g|gif|webp|svg\+xml)|video\/(mp4|webm|quicktime|x-msvideo|x-matroska))$/;

// Đảm bảo thư mục tồn tại trước khi multer ghi file.
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

@Controller('admin/uploads')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class UploadsController {
  constructor(private readonly config: ConfigService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          // Tên unique: timestamp + random hex + ext gốc.
          const safe = randomBytes(6).toString('hex');
          const ext = extname(file.originalname).toLowerCase().slice(0, 8);
          cb(null, `${Date.now()}-${safe}${ext}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_TYPES.test(file.mimetype)) {
          cb(new BadRequestException(`Định dạng không hỗ trợ: ${file.mimetype}`), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Thiếu file');
    }
    const apiPort = this.config.get<number>('API_PORT', 4000);
    const apiHost = this.config.get<string>('API_PUBLIC_HOST', `http://localhost:${apiPort}`);
    const url = `${apiHost}/static/uploads/${file.filename}`;
    return {
      url,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}
