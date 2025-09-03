import { Inject, OnModuleDestroy, Optional } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'ws';
import { REDIS_SUB } from '../redis/redis.module';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_ORIGIN || true } })
export class SignalsGateway implements OnGatewayInit, OnModuleDestroy {
  @WebSocketServer()
  server!: Server;

  private intervalHandle: NodeJS.Timeout | null = null;
  private readonly sub: any;

  constructor(@Optional() @Inject(REDIS_SUB) sub: any) {
    this.sub = sub;
  }

  afterInit() {
    if (this.sub) {
      this.sub.subscribe('signals:live').catch(() => {});
      this.sub.on('message', (_channel: string, message: string) => {
        try {
          const parsed = JSON.parse(message);
          const payload = { type: 'signals:live', data: parsed };
          const out = JSON.stringify(payload);
          this.server?.clients?.forEach((client: any) => {
            if (client.readyState === 1) client.send(out);
          });
        } catch {}
      });
    } else {
      // Fallback mock every 5s if Redis not configured
      this.intervalHandle = setInterval(() => {
        const now = new Date();
        const i = Math.floor(Math.random() * 1000);
        const payload = {
          tokenId: `base:0x${(1000 + i).toString(16)}`,
          score: Math.round((Math.random() * 3 + 0.5) * 100) / 100,
          label: (['HYPE_BUILDING','FAKE_PUMP','DEAD_ZONE','WHALE_PLAY'] as const)[i % 4],
          at: now.toISOString(),
        };
        try {
          const message = JSON.stringify({ type: 'signals:live', data: payload });
          this.server?.clients?.forEach((client: any) => {
            if (client.readyState === 1 /* OPEN */) {
              client.send(message);
            }
          });
        } catch {}
      }, 5000);
    }
  }

  onModuleDestroy() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    try { this.sub?.disconnect?.(); } catch {}
  }
}
