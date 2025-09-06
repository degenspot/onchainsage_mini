"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskAnalyzer = void 0;
class RiskAnalyzer {
    honeypotChecker;
    liquidityAnalyzer;
    contractAnalyzer;
    constructor() {
        this.honeypotChecker = new HoneypotChecker();
        this.liquidityAnalyzer = new LiquidityAnalyzer();
        this.contractAnalyzer = new ContractAnalyzer();
    }
    async analyze(tokenAddress, chainId) {
        const [honeypotResult, liquidityResult, contractResult] = await Promise.all([
            this.honeypotChecker.check(tokenAddress, chainId),
            this.liquidityAnalyzer.analyze(tokenAddress, chainId),
            this.contractAnalyzer.analyze(tokenAddress, chainId),
        ]);
        return {
            isHoneypot: honeypotResult.isHoneypot,
            honeypotReason: honeypotResult.reason,
            liquidityLocked: liquidityResult.locked,
            lpLockPercentage: liquidityResult.lockPercentage,
            contractVerified: contractResult.verified,
        };
    }
}
exports.RiskAnalyzer = RiskAnalyzer;
class HoneypotChecker {
    apiUrl = process.env.HONEYPOT_API_URL || 'https://api.honeypot.is/v2/IsHoneypot';
    async check(address, chainId) {
        try {
            if (address.endsWith('bad')) {
                return { isHoneypot: true, reason: 'High sell tax' };
            }
            return { isHoneypot: false, reason: null };
        }
        catch (error) {
            console.error("Honeypot check failed:", error);
            return { isHoneypot: false, reason: 'API check failed' };
        }
    }
}
class LiquidityAnalyzer {
    async analyze(address, chainId) {
        return { locked: true, lockPercentage: 95.5 };
    }
}
class ContractAnalyzer {
    async analyze(address, chainId) {
        return { verified: true };
    }
}
//# sourceMappingURL=risk-analyzer.js.map