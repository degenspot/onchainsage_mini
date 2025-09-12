import { NarrativeSignals } from "@onchainsage/narrative/narrative-analyzer";

export interface TokenData {
    symbol?: string | null;
    price: number;
    liquidity: number;
    volume24h: number;
}

export type AIProviderType = 'rule-based' | 'huggingface' | 'aimlapi' | 'openai';

export interface AIProviderConfig {
    apiKey?: string;
    model?: string;
    rateLimit?: number;
    timeoutMs?: number;
    maxRetries?: number;
}

export interface ThesisGenerationResult {
    thesis: string;
    confidence: number;
    provider: string;
    processingTimeMs: number; 
}

export interface AIProvider {
    generateThesis(
        tokenData: TokenData,
        criteriaMatched: string[],
        narrativeAnalysis: NarrativeSignals
    ): Promise<ThesisGenerationResult>;
}

// The concrete implementations of AIProvider (RuleBasedProvider, OpenAIProvider, etc.)
// will be moved to the 'packages/ai/providers' directory.

// The getAIProvider function will be replaced by a more robust AIProviderFactory
// in 'packages/ai/ai-provider-factory.ts'.
