"use client";

import { usePropheciesToday } from "@/lib/query/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, ListFilter } from "lucide-react";
import { useState } from "react";
import { ApiProphecy } from "@/lib/api/types";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

type SortKey = "rank" | "score" | "postedAt";

const getScoreBadgeClass = (score: number) => {
  if (score > 0.75) {
    return "bg-green-500/20 text-green-500";
  }
  if (score > 0.5) {
    return "bg-yellow-500/20 text-yellow-500";
  }
  return "bg-red-500/20 text-red-500";
};

export default function PropheciesPage() {
  const {
    data: prophecies,
    isLoading,
    isError,
    error,
    refetch,
  } = usePropheciesToday();

  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [chainFilter, setChainFilter] = useState<string>("all");

  const chains = prophecies
    ? ["all", ...Array.from(new Set(prophecies.map((p) => p.chain)))]
    : ["all"];

  const filteredProphecies =
    prophecies?.filter(
      (p) => chainFilter === "all" || p.chain === chainFilter
    ) || [];

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const sortedProphecies = [...filteredProphecies].sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];

    if (aValue < bValue) {
      return sortOrder === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === "asc" ? 1 : -1;
    }
    return 0;
  });

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              There was a problem fetching today's prophecies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error?.message}</p>
            <Button onClick={() => refetch()} className="mt-4 w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Today's Prophecies</CardTitle>
            <CardDescription>
              Tokens our AI has identified with high potential today.
            </CardDescription>
          </div>
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
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort("rank")}>
                <Button variant="ghost" className="px-0">
                  Rank
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Chain</TableHead>
              <TableHead onClick={() => handleSort("score")}>
                <Button variant="ghost" className="px-0">
                  Score
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead onClick={() => handleSort("postedAt")}>
                <Button variant="ghost" className="px-0">
                  Posted Time
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-10" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : sortedProphecies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No prophecies found for today.
                </TableCell>
              </TableRow>
            ) : (
              sortedProphecies.map((prophecy: ApiProphecy) => (
                <TableRow key={prophecy.id}>
                  <TableCell>
                    <Badge variant="outline">{prophecy.rank}</Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/token/${prophecy.chain.toLowerCase()}/${
                        prophecy.address
                      }`}
                      className="hover:underline"
                    >
                      <div className="font-medium">
                        {prophecy.symbol ??
                          `${prophecy.address.slice(
                            0,
                            6
                          )}...${prophecy.address.slice(-4)}`}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {prophecy.address}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{prophecy.chain}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getScoreBadgeClass(prophecy.score)}>
                      {prophecy.score.toFixed(4)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      {new Date(prophecy.postedAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(prophecy.postedAt).toLocaleTimeString()}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
