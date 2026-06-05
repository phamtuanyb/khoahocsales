import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// PrismaModule toàn cục — các module khác inject PrismaService
// không cần import lại.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
