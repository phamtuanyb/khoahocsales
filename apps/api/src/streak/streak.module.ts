import { Global, Module } from '@nestjs/common';
import { StreakService } from './streak.service';

@Global()
@Module({
  providers: [StreakService],
  exports: [StreakService],
})
export class StreakModule {}
