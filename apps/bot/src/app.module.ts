import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramService } from './telegram/telegram.service';
import Redis from 'ioredis';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, TelegramService],
})
export class AppModule implements OnModuleInit {
    constructor(private readonly telegramService: TelegramService) {}

    onModuleInit() {
        // This is a simple implementation for the bot.
        // In a real-world app, this would be a more robust RedisModule.
        const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
        subscriber.subscribe('prophecies:today', (err, count) => {
            if (err) {
                console.error('Failed to subscribe to prophecies channel', err);
                return;
            }
            console.log(`Subscribed to ${count} channels.`);
        });

        subscriber.on('message', (channel, message) => {
            if (channel === 'prophecies:today') {
                try {
                    const prophecies = JSON.parse(message);
                    console.log(`Received ${prophecies.length} prophecies to announce.`);
                    for (const prophecy of prophecies) {
                        this.telegramService.postProphecy(prophecy);
                    }
                } catch (e) {
                    console.error('Failed to parse and post prophecies', e);
                }
            }
        });
    }
}
