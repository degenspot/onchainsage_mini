import { BaseAIProvider } from './base-ai-provider';
import { TokenData, AIProviderConfig } from '../ai-provider';
import { NarrativeSignals } from '@onchainsage/narrative/narrative-analyzer';
import axios from 'axios';

export class HuggingFaceProvider extends BaseAIProvider {
    private readonly API_URL = 'https://api-inference.huggingface.co/models/';

    constructor(config: AIProviderConfig = {}) {
        super({
            ...config,
            model: config.model || process.env.HUGGINGFACE_MODEL || 'meta-llama/Meta-Llama-3.1-8B-Instruct',
            timeoutMs: config.timeoutMs || parseInt(process.env.HUGGINGFACE_REQUEST_TIMEOUT || '30000', 10),
            rateLimit: config.rateLimit || parseInt(process.env.HUGGINGFACE_RATE_LIMIT || '1000', 10),
        });
        if (!this.config.apiKey) {
            throw new Error('Hugging Face API key is required.');
        }
    }

    protected getProviderName(): string {
        return 'huggingface';
    }

    protected async callAPI(prompt: string): Promise<any> {
        const response = await axios.post(
            `${this.API_URL}${this.config.model}`,
            { inputs: prompt },
            {
                headers: { Authorization: `Bearer ${this.config.apiKey}` },
                timeout: this.config.timeoutMs,
            }
        );
        return response.data;
    }

    protected buildPrompt(
        tokenData: TokenData,
        criteriaMatched: string[],
        narrativeAnalysis: NarrativeSignals
    ): string {
        return `
            System: You are a crypto market analyst. Generate a concise, data-driven investment thesis for the following token based on the provided metrics.

            User:
            Token: ${tokenData.symbol}
            Price: $${tokenData.price}
            Liquidity: $${tokenData.liquidity}
            24h Volume: $${tokenData.volume24h}
            Matched Criteria: ${criteriaMatched.join(', ')}
            Narrative Themes: ${narrativeAnalysis.themes.join(', ')}
            Sentiment Score: ${narrativeAnalysis.sentiment.toFixed(2)}

            Thesis:
        `;
    }

    protected parseResponse(response: any): string {
        if (Array.isArray(response) && response.length > 0) {
            if (response[0].generated_text) {
                return response[0].generated_text.split('Thesis:').pop().trim();
            }
        }
        if (typeof response === 'string') {
            return response;
        }
        if (response.error) {
            throw new Error(`Hugging Face API error: ${response.error}`);
        }
        throw new Error('Invalid response format from Hugging Face API.');
    }
}
