"use client"

import { useState, useMemo } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/ui/chart"

import { Button } from "@/components/ui/button"
import { useSignalsHistory } from "@/lib/query/hooks"
import type { ApiSignalHistoryPoint } from "@/lib/api/types"
import { Skeleton } from "@/components/ui/skeleton"

type ChartPoint = Record<string, string | number>

export function DashboardChart() {
  const [chartMetric, setChartMetric] = useState<'scores' | 'volume' | 'labels'>('scores')
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d")

  const { data, isLoading, error } = useSignalsHistory(timeRange)

  const chartData = useMemo<ChartPoint[]>(() => {
    if (!data) return [] as ChartPoint[];
    // transform ApiSignalHistoryPoint[] into chart points
    return data.map((p: ApiSignalHistoryPoint) => {
      const point: ChartPoint = {
        date: new Date(p.date).toLocaleDateString(),
        score: Number((p.avgScore ?? 0).toFixed(4)),
        total: p.totalSignals ?? 0,
      };
      // include label counts
      if (p.labelCounts) {
        for (const k of Object.keys(p.labelCounts)) {
          point[k] = p.labelCounts[k] ?? 0;
        }
      }
      return point;
    });
  }, [data]);


  /* Improve chart responsiveness */
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={chartMetric === 'scores' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartMetric('scores')}
            className="transition-all-200"
          >
            Signal Scores
          </Button>
          <Button
            variant={chartMetric === 'volume' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartMetric('volume')}
            className="transition-all-200"
          >
            Signal Volume
          </Button>
          <Button
            variant={chartMetric === 'labels' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartMetric('labels')}
            className="transition-all-200"
          >
            Label Breakdown
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={timeRange === "7d" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("7d")}
            className="transition-all-200"
          >
            7D
          </Button>
          <Button
            variant={timeRange === "30d" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("30d")}
            className="transition-all-200"
          >
            30D
          </Button>
          <Button
            variant={timeRange === "90d" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("90d")}
            className="transition-all-200"
          >
            90D
          </Button>
        </div>
      </div>

      <div className="h-[250px] sm:h-[300px] w-full">
        {isLoading ? (
          <Skeleton className="h-[250px] sm:h-[300px] w-full" />
        ) : error ? (
          <div className="text-sm text-red-500">{String((error instanceof Error) ? error.message : error)}</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartMetric === 'scores' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBTC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f7931a" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f7931a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorETH" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#627eea" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#627eea" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSOL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ffbd" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#00ffbd" stopOpacity={0} />
                </linearGradient>
              </defs>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  color: "#fff",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    color: "#fff",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Area type="monotone" dataKey="score" stroke="#60a5fa" strokeWidth={2} fillOpacity={0.2} fill="#60a5fa" />
              </AreaChart>
            ) : chartMetric === 'volume' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    color: "#fff",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Bar dataKey="total" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              // labels stacked area
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "none",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    color: "#fff",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Area type="monotone" dataKey="HYPE_BUILDING" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                <Area type="monotone" dataKey="FAKE_PUMP" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                <Area type="monotone" dataKey="DEAD_ZONE" stackId="1" stroke="#6b7280" fill="#6b7280" fillOpacity={0.3} />
                <Area type="monotone" dataKey="WHALE_PLAY" stackId="1" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.3} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

