import { Injectable, Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// Gateway realtime — namespace /realtime.
// Client kết nối, subscribe sự kiện "leaderboard.invalidated" để re-fetch.
@Injectable()
@WebSocketGateway({
  cors: { origin: '*', credentials: false },
  namespace: '/realtime',
})
export class LeaderboardGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(LeaderboardGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket): void {
    this.logger.debug(`Socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Socket disconnected: ${client.id}`);
  }

  // Phát tín hiệu "bảng X có thay đổi" — client tự re-fetch board đang hiển thị.
  broadcastInvalidation(reason: string): void {
    if (!this.server) return;
    this.server.emit('leaderboard.invalidated', {
      reason,
      at: new Date().toISOString(),
    });
  }
}
