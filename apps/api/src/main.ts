import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import express from 'express';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import helmet from 'helmet';
import { AppModule } from './app.module';

// Hàm bootstrap khởi động ứng dụng NestJS
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('API_PORT', 4000);
  const host = config.get<string>('API_HOST', '0.0.0.0');
  const corsOrigin = config.get<string>('CORS_ORIGIN', 'http://localhost:3004');

  // Helmet — security headers cơ bản (HSTS, X-Frame-Options, XSS-Protection...).
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Đọc cookie từ request (cho httpOnly auth — risk #1).
  const cookieSecret = config.get<string>(
    'COOKIE_SECRET',
    'mkt-academy-cookie-secret-change-me',
  );
  app.use(cookieParser(cookieSecret));

  // Static serving cho file upload (risk #5).
  const uploadDir = config.get<string>('UPLOAD_DIR', './uploads');
  const uploadAbs = join(process.cwd(), uploadDir);
  if (!existsSync(uploadAbs)) mkdirSync(uploadAbs, { recursive: true });
  app.use('/static/uploads', express.static(uploadAbs, { maxAge: '30d', index: false }));

  // CORS — credentials:true để browser gửi/nhận cookie httpOnly.
  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  // Validation toàn cục — kiểm tra DTO tự động
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Prefix cho mọi route: /api/v1
  app.setGlobalPrefix('api/v1');

  await app.listen(port, host);
  Logger.log(`🚀 MKT Academy API đang chạy tại http://${host}:${port}/api/v1`, 'Bootstrap');
}

bootstrap().catch((err) => {
  Logger.error('Không thể khởi động ứng dụng', err, 'Bootstrap');
  process.exit(1);
});
