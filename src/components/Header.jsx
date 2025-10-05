"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// If your file exports `export function ModeToggle() {}`, keep this:
import ModeToggle from "@/components/ui/mode-toggle";
// If your file exports default, use this instead:
// import ModeToggle from "@/components/ui/mode-toggle";

export default function Header() {
  const pathname = usePathname();
  const navClass = (path) =>
    "text-sm transition " +
    (pathname === path
      ? "text-foreground font-medium"
      : "text-muted-foreground hover:text-foreground");

  return (
    <header className="w-full border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link href="/" className="text-xl font-semibold tracking-tight">
          eSentimental
        </Link>

        {/* Right-side Actions */}
        <div className="flex items-center gap-4">
          <Link href="/results" className={navClass("/results")}>
            Results
          </Link>
          <Link href="/features" className={navClass("/features")}>
            Features
          </Link>
          <ModeToggle /> {/* Dark/Light switch */}
        </div>
      </div>
    </header>
  );
}
