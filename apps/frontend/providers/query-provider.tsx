"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

let globalQueryClient: QueryClient | undefined;

export function getQueryClient() {
	if (!globalQueryClient) {
		return undefined;
	}
	return globalQueryClient;
}

type QueryProviderProps = {
	children: React.ReactNode;
};

export function QueryProvider({ children }: QueryProviderProps) {
	const [queryClient] = useState(() => {
		const client = new QueryClient({
			defaultOptions: {
				queries: {
					retry: 1,
					refetchOnWindowFocus: false,
					staleTime: 0,
				},
			},
		});
		globalQueryClient = client;
		return client;
	});

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			{process.env.NODE_ENV !== "production" ? (
				<ReactQueryDevtools initialIsOpen={false} />
			) : null}
		</QueryClientProvider>
	);
}


