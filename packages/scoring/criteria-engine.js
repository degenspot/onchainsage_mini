"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CriteriaEngine = void 0;
const PREDEFINED_CRITERIA_SETS = [
    {
        id: 'early-momentum',
        name: 'Early Momentum',
        description: 'High volume for a new token',
        evaluate: (market, social) => {
            return market.volume24h > 100000 && market.ageMin < 1440 && social.mentions24h > 100;
        },
    },
    {
        id: 'whale-activity',
        name: 'Whale Activity',
        description: 'Large liquidity moves',
        evaluate: (market, social) => {
            return market.liquidity > 500000 && Math.abs(market.price) > 0.1;
        },
    },
    {
        id: 'social-breakout',
        name: 'Social Breakout',
        description: 'Mention spikes with positive sentiment',
        evaluate: (market, social) => {
            return social.mentions24h > 500 && social.slope > 0.5;
        },
    },
];
class CriteriaEngine {
    criteriaSets;
    constructor(customCriteriaSets = []) {
        this.criteriaSets = [...PREDEFINED_CRITERIA_SETS, ...customCriteriaSets];
    }
    evaluate(marketData, socialData) {
        const matched = [];
        let score = 0;
        for (const criteria of this.criteriaSets) {
            if (criteria.evaluate(marketData, socialData)) {
                matched.push(criteria.id);
                score++;
            }
        }
        return {
            passed: matched.length > 0,
            matched,
            score,
        };
    }
}
exports.CriteriaEngine = CriteriaEngine;
//# sourceMappingURL=criteria-engine.js.map