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
};

export type HealthResponse = {
	ok: boolean;
	db: "ok" | "error";
};


