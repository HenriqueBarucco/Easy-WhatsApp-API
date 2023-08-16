import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

const options = {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
};
@WebSocketGateway(options)
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly io: Server) {}
  private connectedClients: Socket[] = [];

  handleConnection(client: Socket, ...args: any[]) {
    this.connectedClients.push(client);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients = this.connectedClients.filter((c) => c !== client);
  }

  @SubscribeMessage('customEvent')
  handleCustomEvent(client: Socket, data: any): void {
    this.connectedClients.forEach((c) => {
      if (c === client) {
        c.emit('customEventResponse', data);
      }
    });
  }

  emitEvent(event: string, data: any): void {
    this.io.emit(event, data);
    this.connectedClients.forEach((c) => {
      c.emit('message', data);
    });
  }
}
