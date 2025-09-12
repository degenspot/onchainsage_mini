import { BaseAIProvider } from './base-ai-provider';
import { TokenData, ThesisGenerationResult } from '../ai-provider';
import { NarrativeSignals } from '@onchainsage/narrative/narrative-analyzer';

export class RuleBasedProvider extends BaseAIProvider {
    protected getProviderName(): string {
        return 'rule-based';
    }

    async generateThesis(
        tokenData: TokenData,
        criteriaMatched: string[],
        narrativeAnalysis: NarrativeSignals
    ): Promise<ThesisGenerationResult> {
        const startTime = Date.now();
        const thesis = this.buildThesis(tokenData, criteriaMatched, narrativeAnalysis);
        const confidence = this.calculateConfidence(criteriaMatched, narrativeAnalysis);
        const processingTimeMs = Date.now() - startTime;

        return {
            thesis,
            confidence,
            provider: this.getProviderName(),
            processingTimeMs,
        };
    }

    private buildThesis(
        tokenData: TokenData,
        criteriaMatched: string[],
        narrativeAnalysis: NarrativeSignals
    ): string {
        let thesis = `Thesis for ${tokenData.symbol || 'token'}:\n`;
        
        if (criteriaMatched.includes('early-momentum')) {
            thesis += `- Strong early momentum detected with significant 24h volume of $${tokenData.volume24h.toFixed(2)}.\n`;
        }
        if (criteriaMatched.includes('social-breakout')) {
            thesis += `- Social chatter is rapidly increasing, indicating a breakout in community interest.\n`;
        }
        if (narrativeAnalysis.sentiment > 0.5) {
            thesis += `- Overall sentiment is highly positive.\n`;
        }
        if (narrativeAnalysis.themes.length > 0) {
            thesis += `- Key narrative themes: ${narrativeAnalysis.themes.join(', ')}.\n`;
        }

        if (thesis === `Thesis for ${tokenData.symbol || 'token'}:\n`) {
            return "A token of interest with notable on-chain activity.";
        }
        
        return thesis;
    }

    private calculateConfidence(
        criteriaMatched: string[],
        narrativeAnalysis: NarrativeSignals
    ): number {
        let score = 0;
        if (criteriaMatched.length > 0) score += 0.3;
        if (narrativeAnalysis.sentiment > 0.5) score += 0.3;
        if (narrativeAnalysis.themes.length > 0) score += 0.2;
        if (narrativeAnalysis.confidence > 0.7) score += 0.2;
        
        return Math.min(score, 1.0);
    }

    // These methods are not used by the rule-based provider but must be implemented.
    protected callAPI(prompt: string, config: any): Promise<any> {
        return Promise.resolve("");
    }
    protected buildPrompt(tokenData: TokenData, criteriaMatched: string[], narrativeAnalysis: NarrativeSignals): string {
        return "";
    }
    protected parseResponse(response: any): string {
        return "";
    }
}
