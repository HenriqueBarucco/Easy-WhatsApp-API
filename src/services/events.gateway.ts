import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { MessageService } from './message.service';

const options = {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
};
@WebSocketGateway(options)
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly io: Server,
    private readonly messageService: MessageService,
  ) {}
  private connectedClients: Socket[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleConnection(client: Socket, ...args: any[]) {
    console.log(
      'Client connected',
      client.handshake.query.key,
      'Id:',
      client.id,
    );
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

  @SubscribeMessage('message')
  handleMessageEvent(client: Socket, data: any): void {
    this.messageService.sendText(
      client.handshake.query.key[0],
      data.phone,
      data.message,
    );
  }

  emitEvent(key: string, event: string, data?: any): void {
    this.connectedClients.forEach((c) => {
      if (c.handshake.query.key === key) {
        c.emit(event, data);
      }
    });
  }
}
