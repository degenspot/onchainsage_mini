import { BaseAIProvider } from './base-ai-provider';
import { TokenData, AIProviderConfig } from '../ai-provider';
import { NarrativeSignals } from '@onchainsage/narrative/narrative-analyzer';
import OpenAI from 'openai';

export class OpenAIProvider extends BaseAIProvider {
    private openai: OpenAI;

    constructor(config: AIProviderConfig = {}) {
        super({
            ...config,
            model: config.model || process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            timeoutMs: config.timeoutMs || parseInt(process.env.OPENAI_REQUEST_TIMEOUT || '30000', 10),
            rateLimit: config.rateLimit || parseInt(process.env.OPENAI_RATE_LIMIT || '3000', 10),
        });
        if (!this.config.apiKey) {
            throw new Error('OpenAI API key is required.');
        }
        this.openai = new OpenAI({ apiKey: this.config.apiKey });
    }

    protected getProviderName(): string {
        return 'openai';
    }

    protected async callAPI(prompt: string): Promise<any> {
        const completion = await this.openai.chat.completions.create({
            model: this.config.model!,
            messages: [{ role: 'user', content: prompt }],
        });
        return completion;
    }

    protected buildPrompt(
        tokenData: TokenData,
        criteriaMatched: string[],
        narrativeAnalysis: NarrativeSignals
    ): string {
        return `
            As an expert crypto analyst, generate a sharp investment thesis for ${tokenData.symbol}.
            Key data:
            - Price: $${tokenData.price}
            - Liquidity: $${tokenData.liquidity}
            - 24h Volume: $${tokenData.volume24h}
            - Matched investment triggers: ${criteriaMatched.join(', ')}
            - Social narrative themes: ${narrativeAnalysis.themes.join(', ')}
            - Sentiment score: ${narrativeAnalysis.sentiment.toFixed(2)}
            
            Synthesize this into a compelling, professional-grade thesis.
        `;
    }

    protected parseResponse(response: any): string {
        if (response.choices && response.choices.length > 0 && response.choices[0].message) {
            return response.choices[0].message.content || '';
        }
        throw new Error('Invalid response format from OpenAI API.');
    }
}
