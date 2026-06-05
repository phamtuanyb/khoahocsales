import { Global, Module } from '@nestjs/common';
import { AdminCoachController } from './admin-coach.controller';
import { CoachController } from './coach.controller';
import { CoachService } from './coach.service';
import { CoachScenariosService } from './coach-scenarios.service';
import { AiSettingsService } from './ai-settings.service';
import { OpenAiService } from './openai.service';

// Module AI toàn cục — QuizService dùng OpenAiService để chấm tình huống.
@Global()
@Module({
  controllers: [CoachController, AdminCoachController],
  providers: [OpenAiService, CoachService, CoachScenariosService, AiSettingsService],
  exports: [OpenAiService, CoachService, CoachScenariosService, AiSettingsService],
})
export class AiModule {}
