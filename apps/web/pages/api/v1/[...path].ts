import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextApiRequest, NextApiResponse } from 'next';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { existsSync, mkdirSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { AppModule } from '../../../../api/src/app.module';

let serverPromise: Promise<express.Express> | null = null;

async function createServer(): Promise<express.Express> {
  const server = express();
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(server),
    { logger: ['log', 'error', 'warn', 'debug', 'verbose'] },
  );

  const config = app.get(ConfigService);
  const corsOrigin = config.get<string>('CORS_ORIGIN');

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  const cookieSecret = config.get<string>(
    'COOKIE_SECRET',
    'mkt-academy-cookie-secret-change-me',
  );
  app.use(cookieParser(cookieSecret));

  const uploadDir = config.get<string>(
    'UPLOAD_DIR',
    process.env.VERCEL ? '/tmp/uploads' : './uploads',
  );
  const uploadAbs = isAbsolute(uploadDir) ? uploadDir : join(process.cwd(), uploadDir);
  if (!existsSync(uploadAbs)) mkdirSync(uploadAbs, { recursive: true });
  app.use('/static/uploads', express.static(uploadAbs, { maxAge: '30d', index: false }));

  if (corsOrigin) {
    app.enableCors({
      origin: corsOrigin.split(',').map((o) => o.trim()),
      credentials: true,
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api/v1');
  await app.init();
  Logger.log('MKT Academy API bootstrapped for Vercel serverless', 'Vercel');
  return server;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  serverPromise ??= createServer();
  const server = await serverPromise;
  server(req, res);
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
