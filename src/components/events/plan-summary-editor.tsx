"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Loader2, RefreshCw } from "lucide-react";
import type { ChecklistCategory } from "@/lib/types";
import { CHECKLIST_CATEGORIES } from "@/lib/types";
import {
  regenerateCategoryChecklists,
  regeneratePlan,
  updatePlanSummary,
} from "@/lib/events/actions";
import { formatCategory } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type PlanSummaryEditorProps = {
  eventId: string;
  initialSummary: string | null;
};

export function PlanSummaryEditor({
  eventId,
  initialSummary,
}: PlanSummaryEditorProps) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState(initialSummary ?? "");
  const [category, setCategory] = useState<ChecklistCategory>("venue");
  const [isPending, startTransition] = useTransition();
  const [isRegenerating, startRegenerate] = useTransition();
  const [isPartial, startPartial] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSave() {
    startTransition(async () => {
      await updatePlanSummary(eventId, summary);
      setMessage("Saved");
      setTimeout(() => setMessage(null), 2000);
    });
  }

  function handleRegenerate() {
    if (
      !window.confirm(
        "This replaces your checklists, timeline, and budget with a fresh plan. Continue?",
      )
    ) {
      return;
    }
    startRegenerate(async () => {
      try {
        await regeneratePlan(eventId);
        window.location.reload();
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to regenerate");
      }
    });
  }

  function handlePartialRegenerate() {
    if (
      !window.confirm(
        `Replace only ${formatCategory(category)} checklist items? Other sections stay unchanged.`,
      )
    ) {
      return;
    }
    startPartial(async () => {
      try {
        await regenerateCategoryChecklists(eventId, category);
        window.location.reload();
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to regenerate category");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <p className="font-medium">Plan notes</p>
          <p className="text-xs text-zinc-500">
            AI overview — edit anytime or regenerate checklists
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-zinc-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="space-y-3 border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="min-h-[120px] text-sm leading-relaxed"
            placeholder="Your plan summary..."
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={handleSave} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save notes
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleRegenerate}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Regenerate all
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <Select value={category} onValueChange={(v) => setCategory(v as ChecklistCategory)}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHECKLIST_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {formatCategory(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handlePartialRegenerate}
              disabled={isPartial}
            >
              {isPartial ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Refresh category only
            </Button>
          </div>
          {message ? <p className="text-xs text-zinc-500">{message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
