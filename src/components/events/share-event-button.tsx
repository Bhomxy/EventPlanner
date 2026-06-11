"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Link2, Loader2, X } from "lucide-react";
import { disableEventSharing, enableEventSharing } from "@/lib/events/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ShareEventButtonProps = {
  eventId: string;
  shareToken: string | null;
};

export function ShareEventButton({ eventId, shareToken }: ShareEventButtonProps) {
  const [token, setToken] = useState(shareToken);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const shareUrl = token ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${token}` : null;

  function copyLink(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleEnable() {
    startTransition(async () => {
      const newToken = await enableEventSharing(eventId);
      setToken(newToken);
      copyLink(`${window.location.origin}/share/${newToken}`);
    });
  }

  function handleDisable() {
    startTransition(async () => {
      await disableEventSharing(eventId);
      setToken(null);
    });
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        disabled={isPending}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
        Share
      </Button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close share panel"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-10 z-40 w-80 rounded-xl border border-stone-200 bg-white p-4 shadow-lg dark:border-stone-700 dark:bg-stone-900">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Share this plan</p>
                <p className="mt-0.5 text-xs text-stone-500">
                  Anyone with the link sees a read-only view of the full plan — checklist, run
                  sheet, and budget.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                className="text-stone-400 hover:text-stone-600"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {token && shareUrl ? (
              <div className="space-y-2">
                <div className="flex gap-1.5">
                  <Input readOnly value={shareUrl} className="h-9 text-xs" />
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 shrink-0"
                    onClick={() => copyLink(shareUrl)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={handleDisable}
                  disabled={isPending}
                  className="text-xs text-red-600 hover:underline dark:text-red-400"
                >
                  Disable share link
                </button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                className="w-full"
                onClick={handleEnable}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                Create share link
              </Button>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
