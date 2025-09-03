"use client"

import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpRight, CircleAlert, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type ApiSignal = {
  tokenId: string
  chain: string
  address: string
  symbol?: string
  score: number
  label: "HYPE_BUILDING" | "FAKE_PUMP" | "DEAD_ZONE" | "WHALE_PLAY"
  at: string
}

type SignalRow = {
  id: string
  token: string
  pair: string
  price: number
  change: number
  sentiment: number
  confidence: "high" | "emerging" | "risky"
  timestamp: string
}

const mapApiToRows = (signals: ApiSignal[]): SignalRow[] => {
  return signals.map((s, idx) => ({
    id: `${s.tokenId}-${idx}`,
    token: s.symbol ?? s.address.slice(0, 6),
    pair: `${s.symbol ?? s.address.slice(0, 6)}/USD`,
    price: Math.round((100 + idx * 3 + (s.score % 5)) * 100) / 100,
    change: Math.round(((s.score - 1) * 5) * 10) / 10,
    sentiment: Math.min(100, Math.max(0, Math.round(50 + s.score * 10))),
    confidence: s.label === "HYPE_BUILDING" ? "high" : s.label === "WHALE_PLAY" ? "high" : s.label === "DEAD_ZONE" ? "emerging" : "risky",
    timestamp: s.at,
  }))
}

type SignalTableProps = {
  category?: "high" | "emerging" | "risky"
}

export function SignalTable({ category }: SignalTableProps) {
  const [rows, setRows] = useState<SignalRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    fetch(`${apiBase}/signals/top?window=24h&limit=10`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: ApiSignal[] = await res.json()
        setRows(mapApiToRows(data))
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(String(e))
      })
    return () => controller.abort()
  }, [])

  const filteredSignals = category ? (rows || []).filter((signal) => signal.confidence === category) : rows || []

  return (
    <div className="w-full overflow-auto">
      {error && <div className="text-sm text-red-500 mb-2">Failed to load signals: {error}</div>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Token</TableHead>
            <TableHead>Pair</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>24h Change</TableHead>
            <TableHead>Sentiment</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows === null ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">Loading…</TableCell>
            </TableRow>
          ) : (
            filteredSignals.map((signal) => (
              <TableRow key={signal.id}>
                <TableCell className="font-medium">{signal.token}</TableCell>
                <TableCell>{signal.pair}</TableCell>
                <TableCell>${signal.price.toLocaleString()}</TableCell>
                <TableCell>
                  <div className={`flex items-center ${signal.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {signal.change >= 0 ? <ArrowUp className="mr-1 h-4 w-4" /> : <ArrowDown className="mr-1 h-4 w-4" />}
                    {Math.abs(signal.change)}%
                  </div>
                </TableCell>
                <TableCell>
                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${
                        signal.sentiment > 70 ? "bg-green-500" : signal.sentiment > 50 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${signal.sentiment}%` }}
                    ></div>
                  </div>
                  <span className="text-xs">{signal.sentiment}%</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      signal.confidence === "high"
                        ? "default"
                        : signal.confidence === "emerging"
                          ? "secondary"
                          : "destructive"
                    }
                    className="capitalize"
                  >
                    {signal.confidence === "high" && <Zap className="mr-1 h-3 w-3" />}
                    {signal.confidence === "emerging" && <ArrowUpRight className="mr-1 h-3 w-3" />}
                    {signal.confidence === "risky" && <CircleAlert className="mr-1 h-3 w-3" />}
                    {signal.confidence}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(signal.timestamp).toLocaleTimeString()}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                    View Details
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

