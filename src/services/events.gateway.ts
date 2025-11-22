import { Inject, Logger, forwardRef } from '@nestjs/common';
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
  private readonly logger = new Logger(EventsGateway.name);
  constructor(
    @Inject(forwardRef(() => MessageService))
    private readonly messageService: MessageService,
    @Inject(forwardRef(() => TokenService))
    private readonly tokenService: TokenService,
  ) {}
  private connectedClients: Socket[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleConnection(client: Socket, ...args: any[]) {
    const identifier =
      client.handshake.query.key || client.handshake.query.token;
    this.logger.log(`Client connected ${identifier} Id: ${client.id}`);
    this.connectedClients.push(client);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients = this.connectedClients.filter((c) => c !== client);
  }

  @SubscribeMessage('message')
  async handleMessageEvent(
    client: Socket,
    data: {
      phone: string;
      message?: string;
      type?: string;
      file?: { data: string; filename?: string; mimetype?: string };
    },
  ): Promise<void> {
    const key = await this.tokenService.getKeyByToken(
      Array.isArray(client.handshake.query.token)
        ? client.handshake.query.token[0]
        : client.handshake.query.token,
    );
    if (key == null) {
      this.logger.warn(
        `Unable to resolve key for websocket client ${client.id}; ignoring message event`,
      );
      return;
    }

    if (data.type === 'image') {
      const file = this.convertBase64ToFile(data.file);
      if (!file) {
        this.logger.warn(
          `Image payload missing file data for client ${client.id}; skipping send`,
        );
        return;
      }
      await this.messageService.sendImage(
        key,
        data.phone,
        file,
        data.message ?? '',
      );
      return;
    }

    await this.messageService.sendText(key, data.phone, data.message ?? '');
  }

  private convertBase64ToFile(file?: {
    data?: string;
    filename?: string;
    mimetype?: string;
  }): { buffer: Buffer; mimetype: string; originalname: string } | null {
    if (!file?.data) return null;

    const dataUrlParts = file.data.match(/^data:(.+);base64,(.*)$/);
    const base64Payload = dataUrlParts ? dataUrlParts[2] : file.data;

    try {
      const buffer = Buffer.from(base64Payload, 'base64');
      if (!buffer.length) return null;
      const mimetype =
        file.mimetype ?? dataUrlParts?.[1] ?? 'application/octet-stream';
      const originalname = file.filename ?? `socket-image-${Date.now()}`;
      return { buffer, mimetype, originalname };
    } catch (error) {
      this.logger.error('Failed to parse base64 image payload', error as Error);
      return null;
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
