"use client";

import { useState } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

type Message = { role: "user" | "assistant"; content: string };

type EventAiChatProps = {
  eventId: string;
};

const STARTERS = [
  "What should I prioritize this week?",
  "What am I forgetting before event day?",
  "What risks should I watch before event day?",
];

export function EventAiChat({ eventId }: EventAiChatProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: message }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, message, history: messages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");

      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      if (data.source === "fallback") {
        toast("Using offline tips — connect OpenAI for tailored answers", { variant: "info" });
      }
    } catch {
      toast("Could not reach the assistant", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="surface-card rounded-[var(--radius-xl)]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[var(--brand)]" />
          <span className="text-sm font-semibold">Ask about this event</span>
        </div>
        <span className="text-xs text-stone-500">{open ? "Hide" : "Open"}</span>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-[var(--border)] px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="interactive rounded-[var(--radius-sm)] border border-[var(--border)] px-2.5 py-1 text-xs text-stone-600 hover:bg-[var(--brand-muted)]/40 dark:text-stone-400"
                >
                  {q}
                </button>
              ))}
            </div>
          ) : (
            <div className="max-h-64 space-y-3 overflow-y-auto text-sm">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "ml-8 rounded-[var(--radius-md)] bg-[var(--brand-muted)]/50 px-3 py-2"
                      : "mr-4 rounded-[var(--radius-md)] bg-stone-100 px-3 py-2 dark:bg-stone-900"
                  }
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about priorities, risks, marketing…"
              className="min-h-[44px] flex-1 resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <Button type="button" size="icon" disabled={loading || !input.trim()} onClick={() => send(input)}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
