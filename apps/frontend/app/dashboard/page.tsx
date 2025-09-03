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

export default function Dashboard() {
  return (
    <div className="p-4 md:p-6">
      <div className="grid gap-4 md:gap-6 w-full">
        {/* Overview Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { title: "Total Prophecies", value: "142", change: "+22%" },
            { title: "High Confidence", value: "36", change: "+12%" },
            { title: "Emerging Trends", value: "89", change: "+18%" },
            { title: "Risky Prophecies", value: "17", change: "-5%" },
          ].map((card, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className={`text-xs ${card.change.startsWith("+") ? "text-green-500" : "text-red-500"}`}>
                  {card.change} from last month
                </p>
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

