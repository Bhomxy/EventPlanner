"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookmarkPlus } from "lucide-react";
import { saveEventAsTemplate } from "@/lib/events/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type SaveAsTemplateButtonProps = {
  eventId: string;
  eventName: string;
};

export function SaveAsTemplateButton({ eventId, eventName }: SaveAsTemplateButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(`${eventName} template`);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        await saveEventAsTemplate(eventId, name);
        toast("Template saved");
        setOpen(false);
        router.refresh();
      } catch {
        toast("Could not save template", { variant: "error" });
      }
    });
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <BookmarkPlus className="h-4 w-4" />
        Save as template
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-9 w-48"
        placeholder="Template name"
      />
      <Button type="button" size="sm" disabled={isPending} onClick={handleSave}>
        Save
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}
