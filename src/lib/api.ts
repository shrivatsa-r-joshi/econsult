// src/lib/api.ts
const API_BASE = "/api-python"; // using your Next.js rewrite

export type BackendResult = { label: "positive" | "neutral" | "negative"; score: number };

// Health check stays the same
export async function health() {
  const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
  return res.ok;
}

// NEW: analyze a real File (txt/csv/pdf)
export async function analyzeFile(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Backend error ${res.status}: ${err}`);
  }
  return res.json() as Promise<any>; // your backend returns a big JSON object
}

// NEW: analyze plain text by wrapping it into a pseudo file
export async function analyzeTextAsFile(text: string, filename = "input.txt") {
  const blob = new Blob([text], { type: "text/plain" });
  const file = new File([blob], filename, { type: "text/plain" });
  return analyzeFile(file);
}
