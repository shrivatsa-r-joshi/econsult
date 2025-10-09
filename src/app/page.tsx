"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import ResultsList from "@/components/ResultsList";
import WordCloudCanvas from "@/components/WordCloudCanvas";
import { analyzeFile, analyzeTextAsFile, health } from "@/lib/api";

type ResultRow = { text: string; label: "positive" | "neutral" | "negative"; score: number; at?: number };

export default function Page() {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [words, setWords] = useState<Array<{ word: string; weight: number }>>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiUp, setApiUp] = useState<boolean | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);

  function makeWordCloudFromBackend(sentiments: any) {
    if (!sentiments) return [];
    const freq: Record<string, number> = {
      ...sentiments.keyword_freqs?.positive,
      ...sentiments.keyword_freqs?.neutral,
      ...sentiments.keyword_freqs?.negative,
    };
    return Object.entries(freq)
      .slice(0, 60)
      .map(([word, weight]) => ({ word, weight: Number(weight) }));
  }

  async function ensureHealth() {
    if (apiUp === null) {
      const ok = await health();
      setApiUp(ok);
      return ok;
    }
    return apiUp;
  }

  /** ✅ Analyze textarea content by wrapping it into a pseudo file */
  async function handleAnalyze() {
    const text = inputText.trim();
    if (!text) return;
    setLoading(true);
    try {
      const ok = await ensureHealth();
      if (!ok) return alert("Backend not reachable.");

      const out = await analyzeTextAsFile(text);

      // Map backend JSON -> ResultRow[]
      const sentiments = out?.sentiments;
      const combined: ResultRow[] = [
        ...(sentiments?.positive || []).map((t: string) => ({ text: t, label: "positive", score: 0.9, at: Date.now() })),
        ...(sentiments?.neutral || []).map((t: string) => ({ text: t, label: "neutral", score: 0.0, at: Date.now() })),
        ...(sentiments?.negative || []).map((t: string) => ({ text: t, label: "negative", score: -0.8, at: Date.now() })),
      ];

      setResults(combined);
      setWords(makeWordCloudFromBackend(sentiments));
      setInputText("");
    } catch (e) {
      console.error(e);
      alert("Analyze failed. Check console.");
    } finally {
      setLoading(false);
    }
  }

  /** ✅ Analyze uploaded file directly */
  async function handleFileSelected(file: File) {
    if (!file) return;
    setLoading(true);
    try {
      const ok = await ensureHealth();
      if (!ok) return alert("Backend not reachable.");
      const out = await analyzeFile(file);

      const sentiments = out?.sentiments;
      const combined: ResultRow[] = [
        ...(sentiments?.positive || []).map((t: string) => ({ text: t, label: "positive", score: 0.9, at: Date.now() })),
        ...(sentiments?.neutral || []).map((t: string) => ({ text: t, label: "neutral", score: 0.0, at: Date.now() })),
        ...(sentiments?.negative || []).map((t: string) => ({ text: t, label: "negative", score: -0.8, at: Date.now() })),
      ];

      setResults(combined);
      setWords(makeWordCloudFromBackend(sentiments));
    } catch (e) {
      console.error(e);
      alert("File analysis failed. Check console.");
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  /** Demo filler */
  function loadDemo() {
    const demoResults: ResultRow[] = [
      { text: "I absolutely love this product!", label: "positive", score: 0.92, at: Date.now() },
      { text: "The UI is okay, nothing special.", label: "neutral", score: 0.02, at: Date.now() },
      { text: "Support was slow and unhelpful.", label: "negative", score: -0.78, at: Date.now() },
    ];
    setResults(demoResults);
    setWords([
      { word: "love", weight: 9 },
      { word: "great", weight: 7 },
      { word: "amazing", weight: 6 },
      { word: "slow", weight: 6 },
      { word: "unhelpful", weight: 5 },
    ]);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-8 pb-14 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          AI-Powered Insight from High-Volume eConsultations.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Systematically analyze stakeholder comments to ensure every observation informs the final draft.
        </p>

        {/* Input */}
        <div className="mt-8 grid gap-3">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste text here…"
            rows={3}
            className="w-full rounded-md border bg-background p-3 text-sm outline-none"
          />
          <div className="flex flex-wrap gap-3 items-stretch justify-center">
            <Button onClick={handleAnalyze} disabled={loading} className="h-11 px-5">
              {loading ? "Analyzing…" : "Analyze"}
            </Button>

            {/* File upload */}
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.csv,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelected(f);
              }}
            />
            <Button type="button" variant="outline" className="h-11 px-5" onClick={() => fileRef.current?.click()} disabled={loading}>
              Upload File
            </Button>

            <Button type="button" variant="secondary" className="h-11 px-5" onClick={loadDemo} disabled={loading}>
              Load Demo Data
            </Button>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 grid gap-8 md:grid-cols-3">
        <section id="results" className="md:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Results</h2>
          {results.length === 0 ? (
            <div className="text-muted-foreground text-sm">No results yet — upload a file or analyze some text.</div>
          ) : (
            <ResultsList results={results} />
          )}
        </section>

        <aside>
          <h2 className="text-lg font-semibold mb-3">Word Cloud</h2>
          {words.length === 0 ? (
            <div className="rounded-xl border p-4 min-h-[160px] text-sm text-muted-foreground grid place-items-center">
              Word cloud will appear here.
            </div>
          ) : (
            <WordCloudCanvas words={words} />
          )}
        </aside>
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-10 text-sm text-muted-foreground text-center">
        © {new Date().getFullYear()} Legislative Feedback Analysis (LFA) Tool
      </footer>
    </div>
  );
}
