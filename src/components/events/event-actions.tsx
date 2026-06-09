"use client";

import { useTransition } from "react";
import { Archive, Copy, Trash2 } from "lucide-react";
import { archiveEvent, deleteEvent, duplicateEvent } from "@/lib/events/actions";
import { Button } from "@/components/ui/button";

type EventActionsProps = {
  eventId: string;
};

export function EventActions({ eventId }: EventActionsProps) {
  const [isPending, startTransition] = useTransition();

  function handleArchive() {
    if (!window.confirm("Archive this event?")) return;
    startTransition(async () => {
      await archiveEvent(eventId);
    });
  }

  function handleDelete() {
    if (!window.confirm("Delete this event permanently?")) return;
    startTransition(async () => {
      await deleteEvent(eventId);
    });
  }

  function handleDuplicate() {
    startTransition(async () => {
      await duplicateEvent(eventId);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDuplicate}
        disabled={isPending}
      >
        <Copy className="h-4 w-4" />
        Duplicate
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleArchive}
        disabled={isPending}
      >
        <Archive className="h-4 w-4" />
        Archive
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={isPending}
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
    </div>
  );
}
