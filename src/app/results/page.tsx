"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WordCloudCanvas from "@/components/WordCloudCanvas";
import ResultsList from "@/components/ResultsList";

export default function ResultsPage() {
  const [label, setLabel] = useState<"all" | "positive" | "neutral" | "negative">("all");
  const [q, setQ] = useState("");

  // demo data
  const all = [
    { text: "I absolutely love this product!", label: "positive", score: 0.92, at: Date.now() },
    { text: "The UI is okay, nothing special.", label: "neutral", score: 0.02, at: Date.now() },
    { text: "Support was slow and unhelpful.", label: "negative", score: -0.78, at: Date.now() },
  ];

  const filtered = useMemo(
    () =>
      all.filter(
        (r) =>
          (label === "all" || r.label === label) &&
          r.text.toLowerCase().includes(q.toLowerCase())
      ),
    [label, q] // `all` is static here, no need in deps
  );

  const words = [
    { word: "love", weight: 9 },
    { word: "great", weight: 7 },
    { word: "slow", weight: 6 },
    { word: "unhelpful", weight: 5 },
  ];

  const kpis = {
    total: all.length,
    pos: all.filter((r) => r.label === "positive").length,
    neu: all.filter((r) => r.label === "neutral").length,
    neg: all.filter((r) => r.label === "negative").length,
    avg: (all.reduce((s, r) => s + r.score, 0) / all.length).toFixed(2),
  };

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Results</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-xl font-semibold">{kpis.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Positive</div>
            <div className="text-xl font-semibold text-green-500">{kpis.pos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Neutral</div>
            <div className="text-xl font-semibold text-yellow-500">{kpis.neu}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Negative</div>
            <div className="text-xl font-semibold text-red-500">{kpis.neg}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Avg score</div>
            <div className="text-xl font-semibold">{kpis.avg}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={label} onValueChange={(v) => setLabel(v as typeof label)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Label" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="positive">Positive</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
            <SelectItem value="negative">Negative</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Search text…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-60"
        />
        <Button variant="outline">Export CSV</Button>
      </div>

      {/* Charts + Word Cloud */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <div className="text-sm mb-2 font-medium">Sentiment over time</div>
            {/* Placeholder chart (replace with a real chart later) */}
            <div className="h-44 rounded-md border bg-muted/30 grid place-items-center text-sm text-muted-foreground">
              Chart coming soon
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm mb-2 font-medium">Word Cloud</div>
            <WordCloudCanvas words={words} />
          </CardContent>
        </Card>
      </div>

      {/* Results Table/List */}
      <ResultsList results={filtered} />
    </div>
  );
}
