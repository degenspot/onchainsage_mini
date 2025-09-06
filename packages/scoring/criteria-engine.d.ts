export interface MarketData {
    volume24h: number;
    liquidity: number;
    price: number;
    ageMin: number;
}
export interface SocialData {
    mentions24h: number;
    slope: number;
}
export interface CriteriaSet {
    id: string;
    name: string;
    description: string;
    evaluate: (marketData: MarketData, socialData: SocialData) => boolean;
}
export interface EvaluationResult {
    passed: boolean;
    matched: string[];
    score: number;
}
export declare class CriteriaEngine {
    private criteriaSets;
    constructor(customCriteriaSets?: CriteriaSet[]);
    evaluate(marketData: MarketData, socialData: SocialData): EvaluationResult;
}
