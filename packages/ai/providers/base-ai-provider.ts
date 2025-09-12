import { AIProvider, AIProviderConfig, TokenData, ThesisGenerationResult } from '../ai-provider';
import { NarrativeSignals } from '@onchainsage/narrative/narrative-analyzer';
import { RateLimiterSingleton } from '@onchainsage/connectors/dist/social/limiter';

export abstract class BaseAIProvider implements AIProvider {
    protected config: AIProviderConfig;
    private rateLimiter: any;

    constructor(config: AIProviderConfig = {}) {
        this.config = {
            maxRetries: 3,
            timeoutMs: 30000,
            rateLimit: 100,
            ...config,
        };
        this.rateLimiter = RateLimiterSingleton(this.config.rateLimit, 10, this.getProviderName());
    }

    public async generateThesis(
        tokenData: TokenData,
        criteriaMatched: string[],
        narrativeAnalysis: NarrativeSignals
    ): Promise<ThesisGenerationResult> {
        const startTime = Date.now();
        
        return this.rateLimiter.schedule(async () => {
            try {
                const prompt = this.buildPrompt(tokenData, criteriaMatched, narrativeAnalysis);
                
                const apiCallWithRetries = async (retries: number): Promise<any> => {
                    try {
                        return await this.callAPI(prompt, {});
                    } catch (error) {
                        if (retries > 0) {
                            await new Promise(res => setTimeout(res, 1000 * (this.config.maxRetries! - retries + 1)));
                            return apiCallWithRetries(retries - 1);
                        }
                        throw error;
                    }
                };
    
                const response = await apiCallWithRetries(this.config.maxRetries!);
                const thesis = this.parseResponse(response);
                const processingTimeMs = Date.now() - startTime;
    
                return {
                    thesis,
                    confidence: this.calculateConfidence(response),
                    provider: this.getProviderName(),
                    processingTimeMs,
                };
            } catch (error) {
                console.error(`Error in ${this.getProviderName()}:`, error);
                throw error;
            }
        });
    }

    protected abstract callAPI(prompt: string, config: any): Promise<any>;
    protected abstract buildPrompt(
        tokenData: TokenData,
        criteriaMatched: string[],
        narrativeAnalysis: NarrativeSignals
    ): string;
    protected abstract parseResponse(response: any): string;
    protected abstract getProviderName(): string;
    
    protected calculateConfidence(response: any): number {
        // Default confidence calculation, can be overridden by subclasses
        return 0.85;
    }
}
