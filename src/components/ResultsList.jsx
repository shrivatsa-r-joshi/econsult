"use client";
/**
 * ResultsList
 * @param {{ results: Array<{ text: string, label: 'positive'|'neutral'|'negative', score: number, source?: string, at?: string|number|Date }> }} props
 */
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const labelColor = (label) =>
  label === "positive" ? "text-green-500"
  : label === "negative" ? "text-red-500"
  : "text-yellow-500";

export default function ResultsList({ results = [] }) {
  if (!results.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No results yet — upload a file or analyze some text.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {results.map((r, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">Input</div>
                <p className="mt-1 truncate">{r.text}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {r.source ? <span>source: {r.source}</span> : null}
                  {r.at ? <span>at: {new Date(r.at).toLocaleString()}</span> : null}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className={`font-semibold capitalize ${labelColor(r.label)}`}>
                  {r.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  score {Number(r.score).toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
