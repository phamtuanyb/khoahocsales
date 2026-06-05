import { Module } from '@nestjs/common';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminConfigController } from './admin-config.controller';
import { AdminConfigService } from './admin-config.service';
import { AdminContentController } from './admin-content.controller';
import { AdminContentService } from './admin-content.service';
import { AdminQuestionsController } from './admin-questions.controller';
import { AdminQuestionsService } from './admin-questions.service';
import { QuestionsImportService } from './questions-import.service';

// Module gộp các controller admin — đều require @Roles(ADMIN) ở từng controller.
@Module({
  controllers: [
    AdminContentController,
    AdminQuestionsController,
    AdminConfigController,
    AdminAnalyticsController,
  ],
  providers: [
    AdminContentService,
    AdminQuestionsService,
    QuestionsImportService,
    AdminConfigService,
    AdminAnalyticsService,
  ],
})
export class AdminModule {}
