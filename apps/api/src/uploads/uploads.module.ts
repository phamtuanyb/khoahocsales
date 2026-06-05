import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';

// Static serving cho /static/uploads/* được mount trong main.ts qua express.static.
@Module({
  controllers: [UploadsController],
})
export class UploadsModule {}
