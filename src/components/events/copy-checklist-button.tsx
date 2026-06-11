"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { copyChecklistFromEvent, getEventsForCopyPicker } from "@/lib/events/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CopyChecklistDialogProps = {
  eventId: string;
};

export function CopyChecklistButton({ eventId }: CopyChecklistDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    getEventsForCopyPicker(eventId).then(setEvents).catch(() => setEvents([]));
  }, [open, eventId]);

  function handleCopy() {
    if (!sourceId) return;
    startTransition(async () => {
      try {
        await copyChecklistFromEvent(eventId, sourceId, mode);
        toast(mode === "merge" ? "Checklist merged" : "Checklist replaced");
        setOpen(false);
        router.refresh();
      } catch {
        toast("Could not copy checklist", { variant: "error" });
      }
    });
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Copy className="h-4 w-4" />
        Copy from event
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)]/40 p-3">
      <Select value={sourceId} onValueChange={setSourceId}>
        <SelectTrigger className="h-9 w-52">
          <SelectValue placeholder="Pick source event" />
        </SelectTrigger>
        <SelectContent>
          {events.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={mode} onValueChange={(v) => setMode(v as "merge" | "replace")}>
        <SelectTrigger className="h-9 w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="merge">Merge</SelectItem>
          <SelectItem value="replace">Replace</SelectItem>
        </SelectContent>
      </Select>
      <Button type="button" size="sm" disabled={!sourceId || isPending} onClick={handleCopy}>
        Copy
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}
