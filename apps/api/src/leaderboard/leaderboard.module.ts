import { Global, Module } from '@nestjs/common';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardGateway } from './leaderboard.gateway';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardSnapshotService } from './leaderboard-snapshot.service';

@Global()
@Module({
  controllers: [LeaderboardController],
  providers: [LeaderboardService, LeaderboardGateway, LeaderboardSnapshotService],
  exports: [LeaderboardService, LeaderboardGateway],
})
export class LeaderboardModule {}
