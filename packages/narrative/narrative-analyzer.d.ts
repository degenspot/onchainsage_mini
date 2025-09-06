export interface SocialData {
    mentions24h: number;
    slope: number;
}
export interface NarrativeSignals {
    sentiment: number;
    momentum: number;
    coherence: number;
    themes: string[];
}
export declare class NarrativeAnalyzer {
    constructor();
    analyze(socialData: SocialData, tokenMeta: {
        symbol?: string | null;
    }): NarrativeSignals;
    private calculateSentiment;
    private calculateMomentum;
    private extractThemes;
    private calculateCoherence;
}
