import { Global, Module } from '@nestjs/common';
import { MissionController } from './mission.controller';
import { MissionService } from './mission.service';

@Global()
@Module({
  controllers: [MissionController],
  providers: [MissionService],
  exports: [MissionService],
})
export class MissionModule {}
