import { BaseAIProvider } from './base-ai-provider';
import { TokenData, AIProviderConfig } from '../ai-provider';
import { NarrativeSignals } from '@onchainsage/narrative/narrative-analyzer';
import axios from 'axios';

export class AimlAPIProvider extends BaseAIProvider {
    private readonly API_URL = 'https://api.aimlapi.com/v2/chat/completions';

    constructor(config: AIProviderConfig = {}) {
        super({
            ...config,
            model: config.model || process.env.AIMLAPI_MODEL || 'aiml/meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
            timeoutMs: config.timeoutMs || parseInt(process.env.AIMLAPI_REQUEST_TIMEOUT || '30000', 10),
            rateLimit: config.rateLimit || parseInt(process.env.AIMLAPI_RATE_LIMIT || '500', 10),
        });
        if (!this.config.apiKey) {
            throw new Error('AimlAPI key is required.');
        }
    }

    protected getProviderName(): string {
        return 'aimlapi';
    }

    protected async callAPI(prompt: string): Promise<any> {
        const payload = {
            model: this.config.model,
            messages: [{ role: 'user', content: prompt }],
        };

        const response = await axios.post(this.API_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.apiKey}`,
            },
            timeout: this.config.timeoutMs,
        });

        return response.data;
    }

    protected buildPrompt(
        tokenData: TokenData,
        criteriaMatched: string[],
        narrativeAnalysis: NarrativeSignals
    ): string {
        return `
            Generate a detailed investment thesis for the crypto token ${tokenData.symbol}.
            Analyze the following data points and synthesize them into a coherent narrative.
            - Token Symbol: ${tokenData.symbol}
            - Current Price: $${tokenData.price}
            - Liquidity: $${tokenData.liquidity}
            - 24-hour Volume: $${tokenData.volume24h}
            - Key Investment Criteria Met: ${criteriaMatched.join(', ')}
            - Dominant Narrative Themes: ${narrativeAnalysis.themes.join(', ')}
            - Social Sentiment Score (0-1): ${narrativeAnalysis.sentiment.toFixed(2)}
            
            The thesis should be well-structured, insightful, and highlight both potential upsides and risks.
        `;
    }

    protected parseResponse(response: any): string {
        if (response.choices && response.choices.length > 0 && response.choices[0].message) {
            return response.choices[0].message.content;
        }
        throw new Error('Invalid response format from AimlAPI.');
    }
}
