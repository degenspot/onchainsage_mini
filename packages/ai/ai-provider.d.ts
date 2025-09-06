import { NarrativeSignals } from "@onchainsage/narrative/narrative-analyzer";
export interface TokenData {
    symbol?: string | null;
    price: number;
    liquidity: number;
    volume24h: number;
}
export interface AIProvider {
    generateThesis(tokenData: TokenData, criteriaMatched: string[], narrativeAnalysis: NarrativeSignals): Promise<string>;
}
export declare class RuleBasedProvider implements AIProvider {
    generateThesis(tokenData: TokenData, criteriaMatched: string[], narrativeAnalysis: NarrativeSignals): Promise<string>;
}
export declare class OpenAIProvider implements AIProvider {
    private apiKey;
    constructor(apiKey: string);
    generateThesis(tokenData: TokenData, criteriaMatched: string[], narrativeAnalysis: NarrativeSignals): Promise<string>;
}
export declare function getAIProvider(): AIProvider;
