import { Global, Module } from '@nestjs/common';
import { ExpRulesService } from './exp-rules.service';
import { GamificationService } from './gamification.service';

@Global()
@Module({
  providers: [GamificationService, ExpRulesService],
  exports: [GamificationService, ExpRulesService],
})
export class GamificationModule {}
