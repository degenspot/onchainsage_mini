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

const PREDEFINED_CRITERIA_SETS: CriteriaSet[] = [
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
            return market.liquidity > 500000 && Math.abs(market.price) > 0.1; // simplified
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


export class CriteriaEngine {
    private criteriaSets: CriteriaSet[];

    constructor(customCriteriaSets: CriteriaSet[] = []) {
        this.criteriaSets = [...PREDEFINED_CRITERIA_SETS, ...customCriteriaSets];
    }

    evaluate(marketData: MarketData, socialData: SocialData): EvaluationResult {
        const matched: string[] = [];
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
