"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Sparkles, SplitSquareVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { Task } from "@/lib/types";

type TaskAiActionsProps = {
  eventId: string;
  task: Task;
};

export function TaskAiActions({ eventId, task }: TaskAiActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<"subtasks" | "email" | null>(null);
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);

  async function runSubtasks() {
    setLoading("subtasks");
    try {
      const res = await fetch("/api/ai/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, taskId: task.id, action: "subtasks" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(`Added ${data.created} subtasks`);
      router.refresh();
    } catch {
      toast("Could not generate subtasks", { variant: "error" });
    } finally {
      setLoading(null);
    }
  }

  async function runEmail() {
    setLoading("email");
    try {
      const res = await fetch("/api/ai/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, taskId: task.id, action: "email" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDraft({ subject: data.subject, body: data.body });
      toast(data.source === "ai" ? "Email draft ready" : "Basic draft ready (AI offline)", {
        variant: data.source === "ai" ? "success" : "info",
      });
    } catch {
      toast("Could not draft email", { variant: "error" });
    } finally {
      setLoading(null);
    }
  }

  async function copyDraft() {
    if (!draft) return;
    await navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
    toast("Copied to clipboard");
  }

  return (
    <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)]/40 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)]">
        <Sparkles className="h-3.5 w-3.5" />
        AI actions
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled={!!loading} onClick={runSubtasks}>
          {loading === "subtasks" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <SplitSquareVertical className="h-3.5 w-3.5" />
          )}
          Break into subtasks
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={!!loading} onClick={runEmail}>
          {loading === "email" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          Draft vendor email
        </Button>
      </div>
      {draft ? (
        <div className="space-y-2 rounded-[var(--radius-sm)] bg-[var(--surface)] p-3 text-xs">
          <p className="font-semibold">{draft.subject}</p>
          <p className="whitespace-pre-wrap leading-relaxed text-stone-600 dark:text-stone-400">
            {draft.body}
          </p>
          <Button type="button" size="sm" variant="ghost" onClick={copyDraft}>
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>
        </div>
      ) : null}
    </div>
  );
}
