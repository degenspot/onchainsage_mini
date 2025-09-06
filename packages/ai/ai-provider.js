"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = exports.RuleBasedProvider = void 0;
exports.getAIProvider = getAIProvider;
class RuleBasedProvider {
    async generateThesis(tokenData, criteriaMatched, narrativeAnalysis) {
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
}
exports.RuleBasedProvider = RuleBasedProvider;
class OpenAIProvider {
    apiKey;
    constructor(apiKey) {
        this.apiKey = apiKey;
        if (!this.apiKey) {
            throw new Error("OpenAI API key is not provided.");
        }
    }
    async generateThesis(tokenData, criteriaMatched, narrativeAnalysis) {
        console.log("Using OpenAI provider (mock).");
        const prompt = `
            Generate a concise investment thesis for the crypto token ${tokenData.symbol}.
            - Price: $${tokenData.price}
            - Liquidity: $${tokenData.liquidity}
            - 24h Volume: $${tokenData.volume24h}
            - Matched investment criteria: ${criteriaMatched.join(', ')}
            - Social narrative themes: ${narrativeAnalysis.themes.join(', ')}
            - Social sentiment score: ${narrativeAnalysis.sentiment.toFixed(2)}
            The thesis should be a short, compelling paragraph.
        `;
        return `Token ${tokenData.symbol} shows promising signs based on strong social signals and on-chain metrics. With criteria like '${criteriaMatched.join(', ')}' met, it is positioned for potential growth.`;
    }
}
exports.OpenAIProvider = OpenAIProvider;
function getAIProvider() {
    if (process.env.AI_PROVIDER === 'openai' && process.env.OPENAI_API_KEY) {
        return new OpenAIProvider(process.env.OPENAI_API_KEY);
    }
    return new RuleBasedProvider();
}
//# sourceMappingURL=ai-provider.js.map