import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersImportController } from './users-import.controller';
import { UsersImportService } from './users-import.service';

@Module({
  controllers: [UsersController, UsersImportController],
  providers: [UsersService, UsersImportService],
  exports: [UsersService],
})
export class UsersModule {}
