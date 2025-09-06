"use client";

import { ApiProphecy } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { BotMessageSquare, Sparkles, AlertTriangle } from "lucide-react";

const getScoreBadgeClass = (score: number) => {
  if (score > 0.75) return "bg-green-500/20 text-green-500 border-green-500/30";
  if (score > 0.5) return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
  return "bg-red-500/20 text-red-500 border-red-500/30";
};

const getCriteriaBadgeClass = (criteria: string) => {
    switch(criteria) {
        case 'early-momentum': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
        case 'social-breakout': return 'bg-purple-500/20 text-purple-500 border-purple-500/30';
        case 'whale-activity': return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
        default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
}

export function ProphecyCard({ prophecy }: { prophecy: ApiProphecy }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl font-bold">#{prophecy.rank}</span>
                    <Link href={`/token/${prophecy.chain}/${prophecy.address}`} className="hover:underline">
                        {prophecy.symbol ?? prophecy.address.slice(0, 8)}
                    </Link>
                    <Badge variant="secondary">{prophecy.chain}</Badge>
                </CardTitle>
                <div className="text-sm text-muted-foreground mt-1">
                    Posted on {new Date(prophecy.postedAt).toLocaleString()}
                </div>
            </div>
            <div className="text-right">
                <div className="text-lg font-semibold">Score</div>
                <Badge className={getScoreBadgeClass(prophecy.score)} variant="outline">
                    {prophecy.score.toFixed(4)}
                </Badge>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full" defaultValue="thesis">
          <AccordionItem value="thesis">
            <AccordionTrigger>
                <div className="flex items-center gap-2">
                    <BotMessageSquare className="h-5 w-5" /> AI Thesis
                </div>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-base whitespace-pre-wrap">{prophecy.thesis ?? "No thesis generated."}</p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="reasoning">
            <AccordionTrigger>
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" /> AI Reasoning
                </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                    <h4 className="font-semibold mb-2">Matched Criteria</h4>
                    <div className="flex flex-wrap gap-2">
                        {prophecy.criteriaMatched?.map(c => (
                            <Badge key={c} className={getCriteriaBadgeClass(c)} variant="outline">{c.replace('-', ' ')}</Badge>
                        )) ?? <p>No criteria matched.</p>}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">Narrative Score</h4>
                    <div className="flex items-center gap-2">
                        <Progress value={(prophecy.narrativeScore ?? 0) * 100} className="w-full" />
                        <span className="font-mono text-sm">{(prophecy.narrativeScore ?? 0).toFixed(2)}</span>
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">Social Signals</h4>
                     <div className="flex flex-wrap gap-2">
                        {prophecy.socialSignals?.themes?.map((theme: string) => (
                            <Badge key={theme} variant="secondary">{theme}</Badge>
                        )) ?? <p>No social signals.</p>}
                    </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="risk">
            <AccordionTrigger>
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" /> Risk Analysis
                </div>
            </AccordionTrigger>
            <AccordionContent>
              {/* This is a placeholder as risk is not yet in prophecy response */}
              <p>Risk analysis data will be displayed here.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
