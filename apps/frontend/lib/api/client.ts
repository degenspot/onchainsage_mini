const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type FetchOptions = {
	method?: HttpMethod;
	body?: unknown;
	headers?: Record<string, string>;
};

export class ApiError extends Error {
	status: number;
	body: unknown;

	constructor(message: string, status: number, body: unknown) {
		super(message);
		this.status = status;
		this.body = body;
	}
}

export async function apiFetch<TResponse>(path: string, options: FetchOptions = {}): Promise<TResponse> {
	const url = `${API_BASE_URL}${path}`;
	const { method = "GET", body, headers } = options;

	const resp = await fetch(url, {
		method,
		headers: {
			"Content-Type": "application/json",
			...headers,
		},
		body: body ? JSON.stringify(body) : undefined,
		cache: "no-store",
	});

	const contentType = resp.headers.get("content-type") || "";
	const isJson = contentType.includes("application/json");
	const data = isJson ? await resp.json() : await resp.text();

	if (!resp.ok) {
		throw new ApiError(`Request failed: ${resp.status}`, resp.status, data);
	}

	return data as TResponse;
}


