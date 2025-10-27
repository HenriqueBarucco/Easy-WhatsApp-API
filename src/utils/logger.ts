import type { LoggerService } from '@nestjs/common';
import { createLogger, format, transports } from 'winston';
import * as net from 'net';
import { Writable } from 'stream';

function parseLogstashUrl(raw?: string): { host: string; port: number } | null {
  if (!raw) return null;
  try {
    const value = raw.includes('://') ? raw : `tcp://${raw}`;
    const u = new URL(value);
    if (!u.hostname || !u.port) return null;
    return { host: u.hostname, port: Number(u.port) };
  } catch {
    const [host, port] = raw.split(':');
    if (!host || !port) return null;
    const n = Number(port);
    if (!Number.isFinite(n)) return null;
    return { host, port: n };
  }
}

class LogstashSocket {
  private socket: net.Socket | null = null;
  private buffer: Buffer[] = [];
  private connecting = false;
  private readonly opts: {
    host: string;
    port: number;
    retryInterval?: number;
  };

  constructor(opts: { host: string; port: number; retryInterval?: number }) {
    this.opts = opts;
  }

  write(buf: Buffer, cb: (err?: Error | null) => void) {
    if (this.socket && !this.socket.destroyed) {
      this.socket.write(buf as unknown as Uint8Array, undefined, () =>
        cb(null),
      );
      return;
    }
    this.buffer.push(buf);
    this.ensureSocket();
    cb(null);
  }

  private ensureSocket() {
    if (this.connecting) return;
    this.connecting = true;
    const { host, port } = this.opts;
    const retry = this.opts.retryInterval ?? 3000;

    const sock = new net.Socket();
    sock.setKeepAlive(true);
    sock.connect(port, host, () => {
      this.socket = sock;
      this.connecting = false;
      for (const l of this.buffer) {
        sock.write(l as unknown as Uint8Array, undefined, () => {});
      }
      this.buffer = [];
    });
    sock.on('error', () => {});
    sock.on('close', () => {
      this.socket = null;
      this.connecting = false;
      setTimeout(() => this.ensureSocket(), retry);
    });
  }
}

class LogstashWritable extends Writable {
  private readonly sock: LogstashSocket;
  constructor(opts: { host: string; port: number; retryInterval?: number }) {
    super();
    this.sock = new LogstashSocket(opts);
  }

  _write(
    chunk: Buffer | string,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    const buf = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk, encoding || 'utf8');
    this.sock.write(buf, callback);
  }
}

export function createAppLogger(): LoggerService {
  const level = process.env.LOG_LEVEL || 'info';
  const app = process.env.SERVICE_NAME || 'easy-whatsapp-api';
  const ls = parseLogstashUrl(process.env.LOGSTASH_URL);

  const baseFormat = format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  );

  const jsonLine = format.printf((info) => JSON.stringify(info) + '\n');

  const baseMeta = { app, env: process.env.ENV || 'development' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const winstonTransports: any[] = [];

  winstonTransports.push(
    new transports.Console({
      level,
      format: baseFormat,
    }),
  );

  if (ls) {
    winstonTransports.push(
      new transports.Stream({
        level,
        stream: new LogstashWritable({
          host: ls.host,
          port: ls.port,
          retryInterval: 3000,
        }),
        format: format.combine(
          format.timestamp(),
          format.errors({ stack: true }),
          format.splat(),
          jsonLine,
        ),
      }) as unknown,
    );
  }

  const logger = createLogger({
    level,
    defaultMeta: baseMeta,
    transports: winstonTransports,
  });

  class NestWinstonLogger implements LoggerService {
    log(message: unknown, context?: string) {
      logger.info(String(message), { context });
    }

    error(message: unknown, stack?: string, context?: string) {
      logger.error(String(message), { context, stack });
    }

    warn(message: unknown, context?: string) {
      logger.warn(String(message), { context });
    }

    debug(message: unknown, context?: string) {
      logger.debug(String(message), { context });
    }

    verbose(message: unknown, context?: string) {
      logger.verbose(String(message), { context });
    }
  }

  return new NestWinstonLogger();
}
