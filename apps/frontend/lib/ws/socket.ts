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
}

function handlePropheciesToday(queryClient: QueryClient) {
	queryClient.invalidateQueries({ queryKey: qk.prophecies.today() });
}

export class ApiSocket {
	private socket: WebSocket | null = null;
	private listeners = new Map<string, Set<Listener<any>>>();

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
				const data: WebSocketPayload = JSON.parse(ev.data);
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
					this.emit(data.type, data.payload);
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
		this.listeners.get(event)!.add(fn as Listener<any>);
		return () => this.off(event, fn);
	}

	off<T>(event: string, fn: Listener<T>) {
		this.listeners.get(event)?.delete(fn as Listener<any>);
	}

	private emit(event: string, payload: any) {
		this.listeners.get(event)?.forEach((fn) => fn(payload));
	}
}

export const apiSocket = new ApiSocket();


