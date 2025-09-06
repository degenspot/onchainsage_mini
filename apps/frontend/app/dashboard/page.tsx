"use client"

import {
  Filter,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { DashboardChart } from "@/components/dashboard-chart"
import { SignalTable } from "@/components/signal-table"
import { TrendingTokens } from "@/components/trending-tokens"
import { useDashboardOverview } from "@/lib/query/hooks";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data, isLoading, error } = useDashboardOverview();
  const errMsg = error ? (error instanceof Error ? error.message : String(error)) : null;

  return (
    <div className="p-4 md:p-6">
      <div className="grid gap-4 md:gap-6 w-full">
        {/* Overview Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      <Skeleton className="h-4 w-24" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      <Skeleton className="h-8 w-20" />
                    </div>
                    <div className={`text-xs text-gray-500`}>
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))
            : error || !data
            ? (
                <>
                  <div className="text-sm text-red-500 mb-2">{errMsg ?? 'No data'}</div>
                  {[
                    { title: 'Total Prophecies', value: '--', change: 'N/A' },
                    { title: 'High Confidence', value: '--', change: 'N/A' },
                    { title: 'Emerging Trends', value: '--', change: 'N/A' },
                    { title: 'Risky Prophecies', value: '--', change: 'N/A' },
                  ].map((card, idx) => (
                    <Card key={idx}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                        <p className={`text-xs text-gray-500`}>{card.change}</p>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )
            : [
                { title: 'Total Prophecies', value: String(data.totalProphecies), change: 'N/A' },
                { title: 'High Confidence', value: String(data.highConfidence), change: 'N/A' },
                { title: 'Emerging Trends', value: String(data.emergingTrends), change: 'N/A' },
                { title: 'Risky Prophecies', value: String(data.riskyProphecies), change: 'N/A' },
              ].map((card, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <p className={`text-xs text-gray-500`}>{card.change} from last month</p>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Charts and Tables */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Market Overview</CardTitle>
              <CardDescription>Price and volume trends for the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardChart />
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Trending Tokens</CardTitle>
              <CardDescription>Based on social sentiment and on-chain activity</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendingTokens />
            </CardContent>
          </Card>
        </div>

        {/* Trading Prophecies */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Trading Prophecies</CardTitle>
              <CardDescription>Recent prophecies based on AI analysis</CardDescription>
            </div>
            <Button className="border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs gap-2">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4 w-full justify-start overflow-auto">
                <TabsTrigger value="all">All Prophecies</TabsTrigger>
                <TabsTrigger value="high">High Confidence</TabsTrigger>
                <TabsTrigger value="emerging">Emerging</TabsTrigger>
                <TabsTrigger value="risky">Risky</TabsTrigger>
              </TabsList>
              <div className="overflow-auto">
                <TabsContent value="all">
                  <SignalTable />
                </TabsContent>
                <TabsContent value="high">
                  <SignalTable category="high" />
                </TabsContent>
                <TabsContent value="emerging">
                  <SignalTable category="emerging" />
                </TabsContent>
                <TabsContent value="risky">
                  <SignalTable category="risky" />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between flex-wrap gap-4">
            <Button className="border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground">Previous</Button>
            <Button className="bg-primary text-primary-foreground shadow hover:bg-primary/90">Next</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

