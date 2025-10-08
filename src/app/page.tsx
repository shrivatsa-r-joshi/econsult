"use client";

import React, { useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ResultsList from "@/components/ResultsList";
import WordCloudCanvas from "@/components/WordCloudCanvas";

type BackendResult = { label: "positive" | "neutral" | "negative"; score: number };
type ResultRow = { text: string; label: "positive" | "neutral" | "negative"; score: number; at?: number };

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

/** ---- tiny API helpers ---- */
async function analyzeText(text: string): Promise<BackendResult> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Backend error ${res.status}`);
  return res.json();
}
async function health(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

/** ---- simple word freq -> weights for cloud ---- */
function makeWordCloud(items: string[]) {
  const freq = new Map<string, number>();
  for (const t of items) {
    t.toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .split(/\s+/)
      .filter(Boolean)
      .forEach((w) => freq.set(w, (freq.get(w) || 0) + 1));
  }
  const entries = [...freq.entries()]
    .filter(([w]) => w.length > 2) // ignore tiny words
    .sort((a, b) => b[1] - a[1])
    .slice(0, 60);
  return entries.map(([word, weight]) => ({ word, weight }));
}

export default function Page() {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [words, setWords] = useState<Array<{ word: string; weight: number }>>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiUp, setApiUp] = useState<boolean | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);

  /** Ping backend once on first action */
  async function ensureHealth() {
    if (apiUp === null) {
      const ok = await health();
      setApiUp(ok);
      return ok;
    }
    return apiUp;
  }

  /** Analyze the textarea content */
  async function handleAnalyze() {
    const text = inputText.trim();
    if (!text) return;
    setLoading(true);
    try {
      const ok = await ensureHealth();
      if (!ok) {
        alert(`Backend not reachable at ${API_BASE}. Is it running?`);
        return;
      }
      const out = await analyzeText(text);
      const row: ResultRow = { text, label: out.label, score: out.score, at: Date.now() };
      const next = [row, ...results];
      setResults(next);
      setWords(makeWordCloud(next.map((r) => r.text)));
      setInputText("");
    } catch (e) {
      console.error(e);
      alert("Analyze failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  }

  /** Read a text or CSV file and analyze (first 50 non-empty lines to keep it snappy) */
  async function handleFileSelected(file: File) {
    if (!file) return;
    // Only parse .txt/.csv on client; others need server-side parsing
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["txt", "csv"].includes(ext || "")) {
      alert("For now, client-side preview supports .txt or .csv. Others will be added later.");
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      // Split into lines/rows; keep a reasonable sample
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 50);

      const ok = await ensureHealth();
      if (!ok) {
        alert(`Backend not reachable at ${API_BASE}. Is it running?`);
        return;
      }

      // Analyze in parallel (bounded)
      const analyzed = await Promise.all(
        lines.map(async (line) => {
          const out = await analyzeText(line);
          return { text: line, label: out.label, score: out.score, at: Date.now() } as ResultRow;
        })
      );

      const next = [...analyzed, ...results];
      setResults(next);
      setWords(makeWordCloud(next.map((r) => r.text)));
    } catch (e) {
      console.error(e);
      alert("File processing failed. Check console for details.");
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
    setWords(makeWordCloud(demoResults.map((r) => r.text)));
  }

  const disabled = loading;

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

        {/* Input row: textarea + actions */}
        <div className="mt-8 grid gap-3">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste text here…"
            rows={3}
            className="w-full rounded-md border bg-background p-3 text-sm outline-none"
          />
          <div className="flex flex-wrap gap-3 items-stretch justify-center">
            <Button onClick={handleAnalyze} disabled={disabled} className="h-11 px-5">
              {loading ? "Analyzing…" : "Analyze"}
            </Button>

            {/* File upload */}
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.csv,.docx,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelected(f);
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 px-5"
              onClick={() => fileRef.current?.click()}
              disabled={disabled}
            >
              Upload File
            </Button>

            <Button type="button" variant="secondary" className="h-11 px-5" onClick={loadDemo} disabled={disabled}>
              Load Demo Data
            </Button>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Backend: <code>{API_BASE}</code> {apiUp === false ? "— not reachable" : ""}
        </p>
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
