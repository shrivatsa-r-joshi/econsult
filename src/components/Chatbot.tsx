"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MessageCircle, Send } from "lucide-react";

type Role = "user" | "assistant";
type Msg = { id: string; role: Role; content: string; ts: number };

export default function Chatbot() {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<Msg[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "Hi! I’m your Policy Assistant. Ask me about uploading consultation data, how sentiment scoring works, data privacy, or workflow tips.",
      ts: Date.now(),
    },
  ]);

  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text.trim(), ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    // --- Replace this block with your real API call later ---
    // Example (when backend ready):
    // const res = await fetch("/api/chat", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ messages: [...messages, userMsg] }),
    // });
    // const data = await res.json();
    // const assistantText = data.reply;

    // Demo echo-style assistant (placeholder)
    const assistantText =
      "Thanks! (demo) Here’s how I’d help:\n• Confirm data format & privacy\n• Outline steps to upload and analyze\n• Link to policy docs (once connected to your KB)";
    await new Promise((r) => setTimeout(r, 400));
    // --------------------------------------------------------

    const botMsg: Msg = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: assistantText,
      ts: Date.now(),
    };
    setMessages((m) => [...m, botMsg]);
    setLoading(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <>
      {/* Floating chat button */}
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 rounded-full h-12 w-12 shadow-lg"
        aria-label="Open chatbot"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle>Policy Assistant</DialogTitle>
            <DialogDescription>
              Ask questions about the eSentimental workflow, data formats, privacy, or interpreting results.
            </DialogDescription>
          </DialogHeader>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="px-5 pb-3 pt-2 max-h-[60vh] overflow-y-auto space-y-3"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  "flex " + (m.role === "user" ? "justify-end" : "justify-start")
                }
              >
                <div
                  className={
                    "rounded-xl px-3 py-2 max-w-[85%] whitespace-pre-wrap " +
                    (m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground")
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="text-sm text-muted-foreground italic">Assistant is typing…</div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t px-5 py-4">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={2}
                placeholder="Type your question… (Enter to send, Shift+Enter for new line)"
                className="w-full resize-none rounded-md border bg-background p-2 text-sm outline-none"
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="shrink-0"
              >
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
