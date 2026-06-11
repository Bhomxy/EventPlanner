"use client";

import { useState, useTransition } from "react";
import { Archive, Copy, Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import { archiveEvent, deleteEvent, duplicateEvent } from "@/lib/events/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type EventActionsProps = {
  eventId: string;
};

type PendingConfirm = "archive" | "delete" | null;

function useEventActionHandlers(eventId: string) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<PendingConfirm>(null);

  function handleDuplicate() {
    toast("Duplicating event…", { variant: "info" });
    startTransition(async () => {
      await duplicateEvent(eventId);
    });
  }

  function handleArchiveConfirmed() {
    startTransition(async () => {
      await archiveEvent(eventId);
    });
  }

  function handleDeleteConfirmed() {
    startTransition(async () => {
      await deleteEvent(eventId);
    });
  }

  return {
    isPending,
    confirming,
    setConfirming,
    handleDuplicate,
    handleArchiveConfirmed,
    handleDeleteConfirmed,
  };
}

function EventConfirmDialogs({
  confirming,
  setConfirming,
  onArchive,
  onDelete,
}: {
  confirming: PendingConfirm;
  setConfirming: (c: PendingConfirm) => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <ConfirmDialog
        open={confirming === "archive"}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Archive this event?"
        description="The event will be hidden from your dashboard. Its data is kept and it can be restored from the database."
        confirmLabel="Archive event"
        onConfirm={onArchive}
      />
      <ConfirmDialog
        open={confirming === "delete"}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Delete this event permanently?"
        description="All checklists, tasks, timeline items, and budget data for this event will be deleted. This cannot be undone."
        confirmLabel="Delete event"
        destructive
        onConfirm={onDelete}
      />
    </>
  );
}

export function EventActions({ eventId }: EventActionsProps) {
  const {
    isPending,
    confirming,
    setConfirming,
    handleDuplicate,
    handleArchiveConfirmed,
    handleDeleteConfirmed,
  } = useEventActionHandlers(eventId);

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
        onClick={() => setConfirming("archive")}
        disabled={isPending}
      >
        <Archive className="h-4 w-4" />
        Archive
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setConfirming("delete")}
        disabled={isPending}
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
      <EventConfirmDialogs
        confirming={confirming}
        setConfirming={setConfirming}
        onArchive={handleArchiveConfirmed}
        onDelete={handleDeleteConfirmed}
      />
    </div>
  );
}

export function EventCardMenu({ eventId }: EventActionsProps) {
  const [open, setOpen] = useState(false);
  const {
    isPending,
    confirming,
    setConfirming,
    handleDuplicate,
    handleArchiveConfirmed,
    handleDeleteConfirmed,
  } = useEventActionHandlers(eventId);

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
        title="Event actions"
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
              onClick={() => {
                setOpen(false);
                handleDuplicate();
              }}
            />
            <MenuItem
              icon={Archive}
              label="Archive"
              onClick={() => {
                setOpen(false);
                setConfirming("archive");
              }}
            />
            <MenuItem
              icon={Trash2}
              label="Delete"
              destructive
              onClick={() => {
                setOpen(false);
                setConfirming("delete");
              }}
            />
          </div>
        </>
      ) : null}

      <EventConfirmDialogs
        confirming={confirming}
        setConfirming={setConfirming}
        onArchive={handleArchiveConfirmed}
        onDelete={handleDeleteConfirmed}
      />
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
