"use client";

import React from "react";
import Link from "next/link";
import ModeToggle from "@/components/ui/mode-toggle";

export default function Header() {
return (
    <header className="w-full border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link href="/" className="text-xl font-semibold tracking-tight">
        eSentimental
        </Link>

        {/* Right-side Actions */}
        <div className="flex items-center gap-4">
        <Link
            href="#results"
            className="text-sm text-muted-foreground hover:text-foreground transition"
        >
            Results
        </Link>
        <Link
            href="#features"
            className="text-sm text-muted-foreground hover:text-foreground transition"
        >
            Features
        </Link>
        <ModeToggle /> {/* Dark/Light switch */}
        </div>
    </div>
    </header>
);
}
