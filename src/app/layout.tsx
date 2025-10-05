import "./globals.css";
import Header from "@/components/Header";
import Chatbot from "@/components/Chatbot";

// ---- THEME PROVIDER (correct path + default import) ----
import ThemeProvider from "@/components/ThemeProvider";
// If your file uses a named export instead of default, change the line above to:
// import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          {children}
          <Chatbot />
        </ThemeProvider>
      </body>
    </html>
  );
}
