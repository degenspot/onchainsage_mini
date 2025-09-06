"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NarrativeAnalyzer = void 0;
class NarrativeAnalyzer {
    constructor() {
    }
    analyze(socialData, tokenMeta) {
        const sentiment = this.calculateSentiment(socialData);
        const momentum = this.calculateMomentum(socialData);
        const themes = this.extractThemes(socialData, tokenMeta);
        const coherence = this.calculateCoherence(themes);
        return {
            sentiment,
            momentum,
            coherence,
            themes,
        };
    }
    calculateSentiment(socialData) {
        if (socialData.slope > 0)
            return 0.75;
        if (socialData.slope < 0)
            return -0.5;
        return 0.1;
    }
    calculateMomentum(socialData) {
        return Math.min(1, socialData.mentions24h / 1000);
    }
    extractThemes(socialData, tokenMeta) {
        const themes = [];
        if (socialData.mentions24h > 500) {
            themes.push('high-social-volume');
        }
        if (socialData.slope > 0.5) {
            themes.push('growing-interest');
        }
        if (tokenMeta.symbol) {
            themes.push(`${tokenMeta.symbol}-specific-narrative`);
        }
        return themes;
    }
    calculateCoherence(themes) {
        return Math.min(1, themes.length / 2);
    }
}
exports.NarrativeAnalyzer = NarrativeAnalyzer;
//# sourceMappingURL=narrative-analyzer.js.map