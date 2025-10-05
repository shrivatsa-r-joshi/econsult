"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import ResultsList from "@/components/ResultsList";
import WordCloudCanvas from "@/components/WordCloudCanvas";
import Chatbot from "@/components/Chatbot";



export default function Page() {
  const [results, setResults] = useState<any[]>([]);
  const [words, setWords] = useState<Array<{ word: string; weight: number }>>([]);

  // ✅ Demo data function
  function loadDemo() {
    const demoResults = [
      { text: "I absolutely love this product!", label: "positive", score: 0.92 },
      { text: "The UI is okay, nothing special.", label: "neutral", score: 0.02 },
      { text: "Support was slow and unhelpful.", label: "negative", score: -0.78 },
    ];

    const demoWords = [
      { word: "love", weight: 9 },
      { word: "great", weight: 7 },
      { word: "amazing", weight: 6 },
      { word: "okay", weight: 4 },
      { word: "slow", weight: 6 },
      { word: "unhelpful", weight: 5 },
    ];

    setResults(demoResults);
    setWords(demoWords);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <Header />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-8 pb-14 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          AI-Powered Insight from High-Volume eConsultations.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Systematically analyze stakeholder comments to ensure every observation informs the final draft.
        </p>

        <div className="mt-8 flex gap-3 items-stretch">
          <Input
            type="file"
            accept=".txt,.pdf,.docx,.csv"
            className="h-11"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              console.log("Selected file:", file);
            }}
          />
          <Button className="h-11 px-5">Upload</Button>

          {/* ✅ Demo button */}
          <Button
            type="button"
            variant="secondary"
            className="h-11 px-5"
            onClick={loadDemo}
          >
            Load Demo Data
          </Button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          (API wiring comes later — this is just the frontend.)
        </p>
      </section>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 grid gap-8 md:grid-cols-3">
        {/* ✅ Results using your ResultsList component */}
        <section id="results" className="md:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Results</h2>
          <ResultsList results ={results} />
        </section>

        {/* ✅ Word Cloud */}
        <aside>
          <h2 className="text-lg font-semibold mb-3">Word Cloud</h2>
          <WordCloudCanvas words={words} />
        </aside>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-10 text-sm text-muted-foreground text-center">
        © {new Date().getFullYear()} Legislative Feedback Analysis (LFA) Tool
      </footer>
      <Chatbot />

    </div>
  );
}