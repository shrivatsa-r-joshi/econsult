"use client";
/**
 * WordCloudCanvas (placeholder, no external libs)
 * @param {{ words: Array<{ word: string, weight?: number }> }} props
 */
import React, { useMemo } from "react";

export default function WordCloudCanvas({ words = [] }) {
  // Normalize weights -> font sizes (12px .. 34px)
const sized = useMemo(() => {
    if (!words.length) return [];
    const vals = words.map((w) => w.weight ?? 1);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const scale = (v) => 12 + (max === min ? 1 : (v - min) / (max - min)) * 22; // 12..34
    return words
      .slice(0, 60) // keep it light
    .map((w) => ({ ...w, _size: Math.round(scale(w.weight ?? 1)) }));
}, [words]);

if (!sized.length) {
    return (
    <div className="rounded-xl border p-4 min-h-[160px] text-sm text-muted-foreground flex items-center justify-center">
        Word cloud will appear here.
    </div>
    );
}

return (
    <div className="rounded-xl border p-4">
    <div className="flex flex-wrap gap-2 leading-none">
        {sized.map((w, i) => (
        <span
            key={`${w.word}-${i}`}
            style={{ fontSize: `${w._size}px` }}
            className="opacity-90 select-none"
        >
            {w.word}
        </span>
        ))}
    </div>
    </div>
);
}
