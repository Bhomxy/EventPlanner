"use client";

import { useState, useTransition } from "react";
import { Archive, Copy, Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import { archiveEvent, deleteEvent, duplicateEvent } from "@/lib/events/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export function EventCardMenu({ eventId }: EventActionsProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<void>, confirmMessage?: string) {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      setOpen(false);
      return;
    }
    setOpen(false);
    startTransition(async () => {
      await action();
    });
  }

  return (
    <div
      className="relative"
      onClick={(e) => {
        // The card is wrapped in a Link — keep menu clicks from navigating.
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button
        type="button"
        aria-label="Event actions"
        aria-expanded={open}
        disabled={isPending}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors",
          "hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200",
          open && "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200",
        )}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreHorizontal className="h-4 w-4" />
        )}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-8 z-40 w-44 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg dark:border-stone-700 dark:bg-stone-900">
            <MenuItem
              icon={Copy}
              label="Duplicate"
              onClick={() => run(() => duplicateEvent(eventId))}
            />
            <MenuItem
              icon={Archive}
              label="Archive"
              onClick={() => run(() => archiveEvent(eventId), "Archive this event?")}
            />
            <MenuItem
              icon={Trash2}
              label="Delete"
              destructive
              onClick={() => run(() => deleteEvent(eventId), "Delete this event permanently?")}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: typeof Copy;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
        destructive
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          : "text-stone-700 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-800",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
