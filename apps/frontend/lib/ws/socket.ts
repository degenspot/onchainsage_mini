"use client";

type Listener<T> = (payload: T) => void;

export type LiveSignalPayload = {
	tokenId: string;
	score: number;
	label: string;
	at: string;
};

export type PropheciesTodayPayload = unknown[];

const WS_BASE_URL = (() => {
	if (typeof window === "undefined") return "";
	try {
		const httpUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
		const u = new URL(httpUrl);
		u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
		return `${u.protocol}//${u.host}`;
	} catch {
		return "ws://localhost:3001";
	}
})();

export class ApiSocket {
	private socket: WebSocket | null = null;
	private listeners = new Map<string, Set<Listener<any>>>();

	connect() {
		if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
			return;
		}
		this.socket = new WebSocket(`${WS_BASE_URL}`);
		this.socket.onmessage = (ev) => {
			try {
				const data = JSON.parse(ev.data);
				const { type, payload } = data || {};
				this.emit(type, payload);
			} catch {
				// ignore
			}
		};
		this.socket.onclose = () => {
			setTimeout(() => this.connect(), 1500);
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


