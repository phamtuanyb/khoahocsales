import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { BadgeModule } from './badge/badge.module';
import { CertificateModule } from './certificate/certificate.module';
import { GamificationModule } from './gamification/gamification.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { LearningModule } from './learning/learning.module';
import { MissionModule } from './mission/mission.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { QuizModule } from './quiz/quiz.module';
import { StreakModule } from './streak/streak.module';
import { TeamModule } from './team/team.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';

// Module gốc — JwtAuthGuard chặn toàn cục (route public dùng @Public()).
// Thứ tự import quan trọng: các module global (Streak/Mission/Badge/Cert/Leaderboard/Audit)
// phải import TRƯỚC GamificationModule vì Gamification cascade qua chúng.
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    // Bật cron jobs (leaderboard snapshot — risk #7).
    ScheduleModule.forRoot(),
    PrismaModule,
    // Các module hỗ trợ (global) — phải đứng trước Gamification
    StreakModule,
    BadgeModule,
    MissionModule,
    CertificateModule,
    LeaderboardModule,
    AuditModule,
    // AI (cung cấp OpenAiService cho cả Quiz và Coach)
    AiModule,
    // Gamification dùng các module trên để cascade EXP
    GamificationModule,
    // Module nghiệp vụ
    AuthModule,
    UsersModule,
    LearningModule,
    QuizModule,
    ProfileModule,
    TeamModule,
    UploadsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
