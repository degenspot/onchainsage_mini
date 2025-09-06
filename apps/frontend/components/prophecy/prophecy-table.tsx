"use client";

import { ApiProphecy } from "@/lib/api/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

type SortKey = "rank" | "score" | "postedAt";

const getScoreBadgeClass = (score: number) => {
  if (score > 0.75) return "bg-green-500/20 text-green-500";
  if (score > 0.5) return "bg-yellow-500/20 text-yellow-500";
  return "bg-red-500/20 text-red-500";
};

export function ProphecyTable({ prophecies }: { prophecies: ApiProphecy[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const sortedProphecies = [...prophecies].sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];
    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort("rank")}>
                <Button variant="ghost" className="px-2">Rank <ArrowUpDown className="ml-2 h-4 w-4" /></Button>
              </TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Chain</TableHead>
              <TableHead onClick={() => handleSort("score")}>
                <Button variant="ghost" className="px-2">Score <ArrowUpDown className="ml-2 h-4 w-4" /></Button>
              </TableHead>
              <TableHead onClick={() => handleSort("postedAt")}>
                <Button variant="ghost" className="px-2">Posted Time <ArrowUpDown className="ml-2 h-4 w-4" /></Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProphecies.map((prophecy: ApiProphecy) => (
              <TableRow key={prophecy.signalHash}>
                <TableCell><Badge variant="outline">{prophecy.rank}</Badge></TableCell>
                <TableCell>
                  <Link href={`/token/${prophecy.chain.toLowerCase()}/${prophecy.address}`} className="hover:underline">
                    <div className="font-medium">{prophecy.symbol ?? `${prophecy.address.slice(0,6)}...${prophecy.address.slice(-4)}`}</div>
                    <div className="text-xs text-muted-foreground truncate">{prophecy.address}</div>
                  </Link>
                </TableCell>
                <TableCell><Badge variant="secondary">{prophecy.chain}</Badge></TableCell>
                <TableCell><Badge className={getScoreBadgeClass(prophecy.score)}>{prophecy.score.toFixed(4)}</Badge></TableCell>
                <TableCell>
                  <div>{new Date(prophecy.postedAt).toLocaleDateString()}</div>
                  <div className="text-sm text-muted-foreground">{new Date(prophecy.postedAt).toLocaleTimeString()}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
