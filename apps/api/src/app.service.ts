import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { status: string; service: string; time: string } {
    return {
      status: 'ok',
      service: 'MKT Academy API',
      time: new Date().toISOString(),
    };
  }
}
