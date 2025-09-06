"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { qk } from "@/lib/query/keys";
import type { ApiSignalTop, ApiTokenSignals, ApiProphecy, HealthResponse, ApiDashboardOverview, ApiPropheciesWeekly, ApiSignalsHistory } from "@/lib/api/types";

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

export function useDashboardOverview() {
	return useQuery({
		queryKey: qk.dashboard.overview(),
		queryFn: () => apiFetch<ApiDashboardOverview>(`/dashboard/overview`),
		staleTime: 30_000,
		refetchInterval: 45_000,
	});
}

export function usePropheciesWeekly(from?: string, to?: string) {
	const params = [] as string[];
	if (from) params.push(`from=${encodeURIComponent(from)}`);
	if (to) params.push(`to=${encodeURIComponent(to)}`);
	const qs = params.length ? `?${params.join('&')}` : '';
	return useQuery({
		queryKey: qk.prophecies.weekly(from, to),
		queryFn: () => apiFetch<ApiPropheciesWeekly>(`/prophecies/weekly${qs}`),
		staleTime: 300_000,
	});
}

export function useSignalsHistory(window: '7d' | '30d' | '90d' = '7d', limit?: number) {
	const qs = `?window=${window}${limit ? `&limit=${limit}` : ''}`;
		return useQuery({
			queryKey: qk.signals.history(window, limit),
			queryFn: () => apiFetch<ApiSignalsHistory>(`/signals/history${qs}`),
			staleTime: 120_000,
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


