"use client";

import { usePropheciesToday } from "@/lib/query/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListFilter, LayoutGrid, Rows } from "lucide-react";
import { useState } from "react";
import { ApiProphecy } from "@/lib/api/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ProphecyCard } from "@/components/prophecy/prophecy-card";
import { ProphecyTable } from "@/components/prophecy/prophecy-table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function PropheciesPage() {
  const {
    data: prophecies,
    isLoading,
    isError,
    error,
    refetch,
  } = usePropheciesToday();

  const [chainFilter, setChainFilter] = useState<string>("all");
  const [view, setView] = useState<"card" | "table">("card");

  const chains = prophecies
    ? ["all", ...Array.from(new Set(prophecies.map((p) => p.chain)))]
    : ["all"];

  const filteredProphecies =
    prophecies?.filter(
      (p) => chainFilter === "all" || p.chain === chainFilter
    ) || [];

  // Prophecies are already sorted by rank from the API.

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              There was a problem fetching today&apos;s prophecies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{String((error instanceof Error ? error.message : error) ?? 'Error')}</p>
            <Button onClick={() => refetch()} className="mt-4 w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Today&apos;s Prophecies</h1>
          <p className="text-muted-foreground">
            Tokens our AI has identified with high potential today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Filter by Chain
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Chain</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {chains.map((chain) => (
                <DropdownMenuCheckboxItem
                  key={chain}
                  checked={chainFilter === chain}
                  onCheckedChange={() =>
                    setChainFilter(chain === chainFilter ? "all" : chain)
                  }
                >
                  {chain.charAt(0).toUpperCase() + chain.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <ToggleGroup type="single" value={view} onValueChange={(v: string | null) => setView((v as 'card' | 'table') ?? 'card')} size="sm">
            <ToggleGroupItem value="card" aria-label="Card view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view">
              <Rows className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
            ))}
        </div>
      ) : filteredProphecies.length === 0 ? (
        <Card>
            <CardContent className="flex items-center justify-center h-48">
                <p>No prophecies found for today.</p>
            </CardContent>
        </Card>
      ) : view === 'card' ? (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {filteredProphecies.map((prophecy: ApiProphecy) => (
            <ProphecyCard key={prophecy.signalHash} prophecy={prophecy} />
          ))}
        </div>
      ) : (
        <ProphecyTable prophecies={filteredProphecies} />
      )}
    </div>
  );
}
