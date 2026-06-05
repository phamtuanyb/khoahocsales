import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Health check — public để monitor bên ngoài ping được.
  @Public()
  @Get('health')
  getHealth(): { status: string; service: string; time: string } {
    return this.appService.getHealth();
  }
}
