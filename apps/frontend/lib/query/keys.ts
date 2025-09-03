export const qk = {
	signals: {
		top: (window: "1h" | "24h" | "7d", limit: number) =>
			(["signals", "top", window, limit] as const),
		token: (chain: string, address: string, limit?: number) =>
			(["signals", "token", chain, address, limit] as const),
	},
	prophecies: {
		today: () => ["prophecies", "today"] as const,
	},
	health: () => ["health"] as const,
};


