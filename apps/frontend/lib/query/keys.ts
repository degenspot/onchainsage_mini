export const qk = {
	signals: {
		top: (window: "1h" | "24h" | "7d", limit: number) =>
			(["signals", "top", window, limit] as const),
		token: (chain: string, address: string, limit?: number) =>
			(["signals", "token", chain, address, limit] as const),
		history: (window: string, limit?: number) => (["signals", "history", window, limit] as const),
	},
	prophecies: {
		today: () => ["prophecies", "today"] as const,
		weekly: (from?: string, to?: string) => (["prophecies", "weekly", from ?? null, to ?? null] as const),
	},
	dashboard: {
		overview: () => (["dashboard", "overview"] as const),
	},
	health: () => ["health"] as const,
};


