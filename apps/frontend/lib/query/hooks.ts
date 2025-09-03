"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { qk } from "@/lib/query/keys";
import type { ApiSignalTop, ApiTokenSignals, ApiProphecy, HealthResponse } from "@/lib/api/types";

export function useTopSignals(windowParam: "1h" | "24h" | "7d" = "24h", limit = 10) {
	return useQuery({
		queryKey: qk.signals.top(windowParam, limit),
		queryFn: () => apiFetch<ApiSignalTop[]>(`/signals/top?window=${windowParam}&limit=${limit}`),
		staleTime: 10_000,
		refetchInterval: 12_000,
	});
}

export function useTokenSignals(chain: string, address: string, limit = 50) {
	return useQuery({
		queryKey: qk.signals.token(chain, address, limit),
		queryFn: () => apiFetch<ApiTokenSignals>(`/signals/${encodeURIComponent(chain)}/${encodeURIComponent(address)}?limit=${limit}`),
		staleTime: 15_000,
		enabled: Boolean(chain && address),
	});
}

export function usePropheciesToday() {
	return useQuery({
		queryKey: qk.prophecies.today(),
		queryFn: () => apiFetch<ApiProphecy[]>(`/prophecies/today`),
		staleTime: 60_000,
		refetchInterval: 60_000,
	});
}

export function useHealth() {
	return useQuery({
		queryKey: qk.health(),
		queryFn: () => apiFetch<HealthResponse>(`/health`),
		staleTime: 30_000,
		retry: 0,
	});
}


