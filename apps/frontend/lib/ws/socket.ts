"use client";

import { QueryClient } from "@tanstack/react-query";
import { getQueryClient } from "../../providers/query-provider";
import { ApiProphecy, ApiSignalTop } from "../api/types";
import { qk } from "../query/keys";

type Listener<T> = (payload: T) => void;

export type LiveSignalPayload = ApiSignalTop;

export type PropheciesTodayPayload = ApiProphecy[];

type WebSocketPayload =
	| { type: "signals:live"; payload: LiveSignalPayload }
	| { type: "prophecies:today"; payload: PropheciesTodayPayload };

const WS_BASE_URL = (() => {
	if (typeof window === "undefined") return "";
	try {
		const httpUrl =
			process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
		const u = new URL(httpUrl);
		u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
		return `${u.protocol}//${u.host}`;
	} catch {
		return "ws://localhost:3001";
	}
})();

function handleSignalsLive(
	queryClient: QueryClient,
	payload: LiveSignalPayload,
) {
	const queryKey = qk.signals.top("24h", 10);
	const previousData = queryClient.getQueryData<ApiSignalTop[]>(queryKey);
	if (previousData) {
		const nextData = [
			payload,
			...previousData.filter((s) => s.tokenId !== payload.tokenId),
		]
			.sort((a, b) => b.score - a.score)
			.slice(0, 10);
		queryClient.setQueryData(queryKey, nextData);
	}
	// The dashboard overview depends on both signals and prophecies.
	// When a new live signal arrives we should invalidate the overview
	// so its counts/metrics refresh. Also invalidate signals history
	// queries (partial key ['signals','history']) so any chart windows
	// or paginated history variants refetch with the latest data.
	try {
		queryClient.invalidateQueries({ queryKey: qk.dashboard.overview() });
		queryClient.invalidateQueries({ queryKey: ["signals", "history"] });
	} catch (err) {
		// Non-fatal: allow the socket handler to continue even if invalidation fails
		console.error("Failed to invalidate dashboard queries on signals:live", err);
	}
}

function handlePropheciesToday(queryClient: QueryClient) {
	// Invalidate today's prophecies (existing behavior)
	queryClient.invalidateQueries({ queryKey: qk.prophecies.today() });

	// The dashboard overview also depends on prophecy counts — invalidate it
	// so overview cards update when new prophecies arrive.
	// Additionally invalidate weekly prophecy variants so any weekly
	// aggregates or charts refresh.
	try {
		queryClient.invalidateQueries({ queryKey: qk.dashboard.overview() });
		queryClient.invalidateQueries({ queryKey: ["prophecies", "weekly"] });
	} catch (err) {
		console.error("Failed to invalidate dashboard queries on prophecies:today", err);
	}
}

export class ApiSocket {
	private socket: WebSocket | null = null;
	private listeners = new Map<string, Set<Listener<unknown>>>();

	connect() {
		if (
			this.socket &&
			(this.socket.readyState === WebSocket.OPEN ||
				this.socket.readyState === WebSocket.CONNECTING)
		) {
			return;
		}
		this.socket = new WebSocket(`${WS_BASE_URL}`);
		this.socket.onmessage = (ev) => {
			try {
			const data = JSON.parse(ev.data) as WebSocketPayload;
				const queryClient = getQueryClient();

				if (queryClient && data.type) {
					switch (data.type) {
						case "signals:live":
							handleSignalsLive(queryClient, data.payload);
							break;
						case "prophecies:today":
							handlePropheciesToday(queryClient);
							break;
					}
				}

				if (data.type) {
					this.emit(data.type, data.payload as unknown);
				}
			} catch (err) {
				// Gracefully degrade
				console.error("Failed to handle WebSocket message:", err);
			}
		};
		this.socket.onclose = () => {
			setTimeout(() => this.connect(), 1500);
		};
		this.socket.onerror = (err) => {
			console.error("WebSocket error:", err);
		};
	}

	on<T>(event: string, fn: Listener<T>) {
		if (!this.listeners.has(event)) this.listeners.set(event, new Set());
		this.listeners.get(event)!.add(fn as unknown as Listener<unknown>);
		return () => this.off(event, fn);
	}

	off<T>(event: string, fn: Listener<T>) {
		this.listeners.get(event)?.delete(fn as unknown as Listener<unknown>);
	}

	private emit(event: string, payload: unknown) {
		this.listeners.get(event)?.forEach((fn) => (fn as Listener<unknown>)(payload));
	}
}

export const apiSocket = new ApiSocket();


