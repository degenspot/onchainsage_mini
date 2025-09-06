import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';

// This would come from a shared types package or from the API types
export type Prophecy = {
    rank: number;
    symbol?: string;
    address: string;
    chain: string;
    score: number;
    thesis?: string | null;
    criteriaMatched?: string[];
    narrativeScore?: number;
};

@Injectable()
export class TelegramService {
    private bot: Telegraf;

    constructor() {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            console.warn('TELEGRAM_BOT_TOKEN is not set. Bot will not start.');
            return;
        }
        this.bot = new Telegraf(token);
        this.registerCommands();
        this.bot.launch().then(() => console.log('Telegram bot started'));
    }

    private registerCommands() {
        this.bot.start((ctx) => ctx.reply('Welcome to the OnChainSage Bot!'));
        this.bot.command('prophecies', (ctx) => {
            // In a real app, you'd fetch this from the API/DB
            ctx.reply('Fetching today\'s prophecies...');
        });
        this.bot.command('explain', (ctx) => {
             const token = ctx.message.text.split(' ')[1];
             if(!token) return ctx.reply('Please provide a token symbol or address.');
             ctx.reply(`Fetching explanation for ${token}...`);
        });
    }

    public async postProphecy(prophecy: Prophecy) {
        if (!this.bot) return;

        const message = this.formatProphecyMessage(prophecy);
        
        // In a real app, you would have a list of chat IDs to send to.
        // For now, let's assume a single channel from env var.
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (chatId) {
            try {
                await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            } catch (error) {
                console.error('Failed to send message to Telegram:', error);
            }
        }
    }

    private formatProphecyMessage(prophecy: Prophecy): string {
        let msg = `🔮 *New Prophecy (#${prophecy.rank})* 🔮\n\n`;
        msg += `*Token:* ${prophecy.symbol ?? prophecy.address}\n`;
        msg += `*Chain:* ${prophecy.chain}\n`;
        msg += `*Score:* ${prophecy.score.toFixed(4)}\n\n`;
        
        if (prophecy.thesis) {
            msg += `*AI Thesis:*\n_${prophecy.thesis}_\n\n`;
        }
        
        if (prophecy.criteriaMatched && prophecy.criteriaMatched.length > 0) {
            msg += `*Matched Criteria:*\n`
            msg += prophecy.criteriaMatched.map(c => `✅ \`${c}\``).join('\n');
            msg += '\n\n'
        }

        msg += `[View on App](https://app.onchainsage.com/token/${prophecy.chain}/${prophecy.address})`;

        return msg;
    }

    onModuleDestroy() {
        this.bot?.stop('SIGINT');
    }
}
