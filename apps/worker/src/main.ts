import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Worker app: no HTTP server; run as application context
  await NestFactory.createApplicationContext(AppModule);
}
bootstrap();
