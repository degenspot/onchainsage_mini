"use client"

import { ArrowLeft, ArrowDown, ArrowUp, CircleAlert, Zap, ArrowUpRight, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useTokenSignals } from "@/lib/query/hooks"
import { SignalChart } from "@/components/signal-chart"

export default function TokenDetailsPage({ params }: { params: { chain: string; address: string } }) {
  const { chain, address } = params
  const router = useRouter()
  const { data: signals, isLoading, error, refetch } = useTokenSignals(chain, address)

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    }
  }

  const getConfidenceVariant = (label: string) => {
    switch (label) {
      case "HYPE_BUILDING":
      case "WHALE_PLAY":
        return "default"
      case "DEAD_ZONE":
        return "secondary"
      case "FAKE_PUMP":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getConfidenceIcon = (label: string) => {
    switch (label) {
      case "HYPE_BUILDING":
      case "WHALE_PLAY":
        return <Zap className="mr-1 h-3 w-3" />
      case "DEAD_ZONE":
        return <ArrowUpRight className="mr-1 h-3 w-3" />
      case "FAKE_PUMP":
        return <CircleAlert className="mr-1 h-3 w-3" />
      default:
        return null
    }
  }

  const formatLabel = (label: string) => {
    return label.toLowerCase().replace(/_/g, ' ')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* Header with Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Token Details</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Chain:</span> {chain}
              </div>
              <div className="hidden sm:block text-muted-foreground">•</div>
              <div className="text-sm text-muted-foreground break-all">
                <span className="font-medium">Address:</span> {address}
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-foreground">Token</span>
          <span>/</span>
          <span className="text-foreground">{chain}</span>
          <span>/</span>
          <span className="text-foreground truncate max-w-[100px] sm:max-w-none">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </nav>

        {/* Main Content */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Trading Prophecies</CardTitle>
              <CardDescription>
                Historical prophecies for this token based on AI analysis
              </CardDescription>
            </div>
            {error && (
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            )}
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-2">Failed to load prophecies</div>
                <div className="text-sm text-muted-foreground mb-4">
                  {error instanceof Error ? error.message : String(error)}
                </div>
                <button
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              </div>
            ) : isLoading ? (
              // Loading skeletons for chart and table
              <>
                <div className="h-[250px] sm:h-[300px] w-full mb-6">
                  <Skeleton className="h-full w-full" />
                </div>
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Score</TableHead>
                        <TableHead>Prophecy Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : signals && signals.length > 0 ? (
              <>
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-2 text-center">Prophecy Score Over Time</h3>
                  <SignalChart data={signals.map(s => ({ x: s.at, y: s.score }))} />
                </div>
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Score</TableHead>
                        <TableHead>Prophecy Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {signals.map((signal, index) => {
                        const { date, time } = formatTimestamp(signal.at)
                        return (
                          <TableRow key={`${signal.tokenId}-${index}`}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {signal.score >= 0 ? (
                                  <ArrowUp className="h-4 w-4 text-green-500" />
                                ) : (
                                  <ArrowDown className="h-4 w-4 text-red-500" />
                                )}
                                <span className={signal.score >= 0 ? "text-green-500" : "text-red-500"}>
                                  {signal.score.toFixed(2)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getConfidenceVariant(signal.label)}
                                className="capitalize"
                              >
                                {getConfidenceIcon(signal.label)}
                                {formatLabel(signal.label)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {date}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {time}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No prophecies found for this token
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {signals && signals.length > 0 && (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Prophecies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{signals.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(signals.reduce((sum, s) => sum + s.score, 0) / signals.length).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">High Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {signals.filter(s => s.label === "HYPE_BUILDING" || s.label === "WHALE_PLAY").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Latest Prophecy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {signals.length > 0 ? formatTimestamp(signals[0].at).date : "N/A"}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}