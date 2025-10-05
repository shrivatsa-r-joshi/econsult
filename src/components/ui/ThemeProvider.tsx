"use client"

import React from "react"
import { ThemeProvider } from "next-themes"

export default function ThemeProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" enableSystem={true} defaultTheme="system">
      {children}
    </ThemeProvider>
  )
}
