import { Inject, forwardRef } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { MessageService } from './message.service';
import { TokenService } from './token.service';

const options = {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
};
@WebSocketGateway(options)
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @Inject(forwardRef(() => MessageService))
    private readonly messageService: MessageService,
    @Inject(forwardRef(() => TokenService))
    private readonly tokenService: TokenService,
  ) {}
  private connectedClients: Socket[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleConnection(client: Socket, ...args: any[]) {
    console.log(
      'Client connected',
      client.handshake.query.key || client.handshake.query.token,
      'Id:',
      client.id,
    );
    this.connectedClients.push(client);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients = this.connectedClients.filter((c) => c !== client);
  }

  // @SubscribeMessage('customEvent')
  // handleCustomEvent(client: Socket, data: any): void {
  //   this.connectedClients.forEach((c) => {
  //     if (c === client) {
  //       c.emit('customEventResponse', data);
  //     }
  //   });
  // }

  @SubscribeMessage('message')
  async handleMessageEvent(client: Socket, data: any): Promise<void> {
    console.log('Token: ', client.handshake.query.token);
    const key = await this.tokenService.getKeyByToken(
      Array.isArray(client.handshake.query.token)
        ? client.handshake.query.token[0]
        : client.handshake.query.token,
    );
    console.log('Message event', key, data);
    if (key != null) {
      await this.messageService.sendText(key, data.phone, data.message);
    }
  }

  emitEvent(key: string, event: string, data?: any): void {
    this.connectedClients.forEach(async (c) => {
      if (c.handshake.query.key === key) {
        c.emit(event, data);
      }
      const token = await this.tokenService.getByKey(key);
      if (token != null) {
        if (c.handshake.query.token === token) {
          c.emit(event, data);
        }
      }
    });
  }
}
