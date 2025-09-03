import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));
  app.enableCors({ origin: process.env.FRONTEND_ORIGIN || true });
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001);
}
bootstrap();
