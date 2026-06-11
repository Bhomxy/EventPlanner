"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl outline-none dark:border-stone-700 dark:bg-stone-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                destructive
                  ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                  : "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
              )}
            >
              <AlertTriangle className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <Dialog.Title className="font-display text-base font-semibold">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              size="sm"
              variant={destructive ? "destructive" : "default"}
              onClick={() => {
                onOpenChange(false);
                onConfirm();
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
