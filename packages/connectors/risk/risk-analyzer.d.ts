export interface RiskFlags {
    isHoneypot: boolean;
    honeypotReason: string | null;
    liquidityLocked: boolean;
    lpLockPercentage: number | null;
    contractVerified: boolean;
}
export declare class RiskAnalyzer {
    private honeypotChecker;
    private liquidityAnalyzer;
    private contractAnalyzer;
    constructor();
    analyze(tokenAddress: string, chainId: string): Promise<RiskFlags>;
}
