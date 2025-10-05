"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Upload, BarChart3, FileText, Lock, Share2 } from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen max-w-6xl mx-auto px-6 py-10">
      {/* Hero */}
      <section className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Features</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          Analyze consultation feedback at scale with explainable sentiment, topic insights, and secure data handling.
        </p>
      </section>

      {/* Feature cards */}
      <section className="grid md:grid-cols-3 gap-6 mb-10">
        <Card><CardContent className="p-5"><Upload className="h-5 w-5 mb-2" /><div className="font-medium">Bulk Uploads</div><p className="text-sm text-muted-foreground">CSV, DOCX, PDF ingestion with progress & history.</p></CardContent></Card>
        <Card><CardContent className="p-5"><BarChart3 className="h-5 w-5 mb-2" /><div className="font-medium">Explainable Sentiment</div><p className="text-sm text-muted-foreground">Labels, scores, and rationales for transparency.</p></CardContent></Card>
        <Card><CardContent className="p-5"><FileText className="h-5 w-5 mb-2" /><div className="font-medium">Topic Clusters</div><p className="text-sm text-muted-foreground">Group comments by themes to spot patterns.</p></CardContent></Card>
        <Card><CardContent className="p-5"><Lock className="h-5 w-5 mb-2" /><div className="font-medium">Privacy & Security</div><p className="text-sm text-muted-foreground">Encryption, retention controls, and region-locked hosting.</p></CardContent></Card>
        <Card><CardContent className="p-5"><Share2 className="h-5 w-5 mb-2" /><div className="font-medium">Exports & Sharing</div><p className="text-sm text-muted-foreground">CSV/PDF reports and shareable views.</p></CardContent></Card>
        <Card><CardContent className="p-5"><Shield className="h-5 w-5 mb-2" /><div className="font-medium">Role-based Access</div><p className="text-sm text-muted-foreground">Analyst, Reviewer, Admin permissions.</p></CardContent></Card>
      </section>

      {/* How it works */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">How it works</h2>
        <ol className="grid md:grid-cols-3 gap-4 text-sm">
          <li className="rounded-lg border p-4"><strong>1. Upload</strong><br/>Add CSV/DOCX/PDF files or paste text.</li>
          <li className="rounded-lg border p-4"><strong>2. Analyze</strong><br/>Get sentiment, topics, and trends.</li>
          <li className="rounded-lg border p-4"><strong>3. Review & Export</strong><br/>Filter, drill down, and export summaries.</li>
        </ol>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-3">FAQ</h2>
        <div className="space-y-3 text-sm">
          <div><strong>Do you store my data?</strong><br/>Configurable retention. Data can remain within your region.</div>
          <div><strong>Can we integrate with SharePoint?</strong><br/>Yes—via connector or scheduled imports (coming soon).</div>
          <div><strong>Can we re-run analysis with updated models?</strong><br/>Yes—jobs can be reprocessed when models improve.</div>
        </div>
      </section>

      <div className="text-center">
        <Button size="lg">Open the App</Button>
      </div>
    </div>
  );
}
