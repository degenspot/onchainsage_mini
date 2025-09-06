export type ApiSignalTop = {
	tokenId: string;
	chain: string;
	address: string;
	symbol?: string;
	score: number;
	label: "HYPE_BUILDING" | "FAKE_PUMP" | "DEAD_ZONE" | "WHALE_PLAY";
	at: string;
};

export type ApiTokenSignal = {
	tokenId: string;
	score: number;
	label: ApiSignalTop["label"];
	at: string;
};

export type ApiTokenSignals = ApiTokenSignal[];

export type ApiProphecy = {
	tokenId: string;
	chain: string;
	address: string;
	symbol?: string;
	score: number;
	rank: number;
	signalHash: string;
	txHash?: string;
	postedAt: string;
	criteria?: Record<string, unknown>;
	thesis?: string;
	narrativeScore?: number;
	criteriaMatched?: string[];
	socialSignals?: Record<string, unknown>;

};

export type HealthResponse = {
	ok: boolean;
	db: "ok" | "error";
};

export type ApiDashboardOverview = {
	totalProphecies: number;
	highConfidence: number;
	emergingTrends: number;
	riskyProphecies: number;
	lastUpdate: string;
};

export type ApiProphecyWeeklyCount = {
	date: string;
	total: number;
	highConfidence: number;
	emergingTrends: number;
	risky: number;
};

export type ApiPropheciesWeekly = ApiProphecyWeeklyCount[];

export type ApiSignalHistoryPoint = {
	date: string;
	avgScore: number;
	totalSignals: number;
	labelCounts: Record<string, number>;
};

export type ApiSignalsHistory = ApiSignalHistoryPoint[];


