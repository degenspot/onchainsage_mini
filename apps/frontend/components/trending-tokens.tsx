"use client"

import { ArrowDown, ArrowUp, ExternalLink } from "lucide-react"
import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTopSignals } from "@/lib/query/hooks"
import type { ApiSignalTop } from "@/lib/api/types"
import { Skeleton } from "@/components/ui/skeleton"

type TrendingToken = {
  id: string
  name: string
  symbol: string
  price: number
  change: number
  volume: number
  marketCap: number
  socialScore: number
}

function mapSignalsToTrendingTokens(signals: ApiSignalTop[]): TrendingToken[] {
  return signals.map((s, idx) => {
    const score = s.score;
    const price = Math.round((1000 + idx * 50 + score * 100) * 100) / 100;
    const change = Math.round(((score - 0.5) * 10) * 10) / 10;
    const volume = Math.round(score * 1e9 + idx * 5e8);
    const marketCap = Math.round(price * volume * 0.1);
    const socialScore = Math.min(100, Math.round(score * 100));
    return {
      id: s.tokenId,
      name: s.symbol ?? s.tokenId.split(":")[1] ?? s.tokenId,
      symbol: s.symbol ?? (s.tokenId.split(":")[1] ?? '').slice(0, 6),
      price,
      change,
      volume,
      marketCap,
      socialScore,
    };
  });
}

export function TrendingTokens() {
  const { data, isLoading, error } = useTopSignals("24h", 5);
  const trendingTokens = useMemo(() => (data ? mapSignalsToTrendingTokens(data) : []), [data]);

  if (error) {
    return <div className="text-sm text-red-500">{String((error instanceof Error ? error.message : error) ?? 'Error')}</div>;
  }

  return (
    <div className="space-y-4">
      {isLoading
        ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0 transition-all-200 hover:bg-muted/30 p-2 rounded-md -mx-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 transition-transform-200 group-hover:scale-110">
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium"><Skeleton className="h-4 w-24" /></span>
                    <span className="text-xs text-muted-foreground"><Skeleton className="h-3 w-10" /></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span><Skeleton className="h-4 w-20" /></span>
                    <span className={`flex items-center text-gray-500`}><Skeleton className="h-4 w-12" /></span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <Badge className="mb-1 transition-all-200"><Skeleton className="h-4 w-24" /></Badge>
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs transition-all-200 hover:bg-primary/10">
                  <span>View</span>
                  <ExternalLink className="h-3 w-3 transition-transform-200 group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          ))
        : trendingTokens.map((token) => (
            <div key={token.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0 transition-all-200 hover:bg-muted/30 p-2 rounded-md -mx-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 transition-transform-200 group-hover:scale-110">
                  {token.symbol.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{token.name}</span>
                    <span className="text-xs text-muted-foreground">{token.symbol}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>${token.price.toLocaleString()}</span>
                    <span className={`flex items-center ${token.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {token.change >= 0 ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
                      {Math.abs(token.change)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <Badge className="mb-1 transition-all-200">Social Score: {token.socialScore}</Badge>
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs transition-all-200 hover:bg-primary/10">
                  <span>View</span>
                  <ExternalLink className="h-3 w-3 transition-transform-200 group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          ))}
    </div>
  )
}

