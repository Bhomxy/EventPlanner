"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createEvent, updateEvent } from "@/lib/events/actions";
import { EVENT_TYPES, type Event } from "@/lib/types";
import { CATEGORY_ORDER, CATEGORY_ICONS, formatCategory, formatEventType } from "@/lib/format";
import { cn } from "@/lib/utils";

type EventFormProps = {
  event?: Event;
  mode?: "create" | "edit";
  templateId?: string;
};

const LOADING_CATEGORIES = CATEGORY_ORDER.slice(0, 6);

export function EventForm({ event, mode = "create", templateId }: EventFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState(event?.type ?? "meetup");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("type", type);
    if (templateId) formData.set("template_id", templateId);

    startTransition(async () => {
      try {
        if (mode === "edit" && event) {
          await updateEvent(event.id, formData);
        } else {
          await createEvent(formData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  if (mode === "edit" && event) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormFields event={event} type={type} setType={setType} showAll />
        {error ? <ErrorMessage message={error} /> : null}
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save changes
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="overview" className="text-stone-700 dark:text-stone-300">
          Describe your event
        </Label>
        <Textarea
          id="overview"
          name="overview"
          required
          rows={5}
          disabled={isPending}
          className="resize-none border-stone-200 bg-stone-50/50 text-base leading-relaxed focus:bg-white dark:border-stone-800 dark:bg-stone-900/50 dark:focus:bg-stone-950"
          placeholder="I'm planning a 300-person AI meetup in Lagos for developers. Goal is to connect the local AI community. Budget around $5k. Date in March..."
        />
        <p className="text-xs text-stone-500">
          Write freely — we&apos;ll build checklists for venue, volunteers, marketing, and more.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Event type</Label>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((eventType) => (
            <button
              key={eventType}
              type="button"
              disabled={isPending}
              onClick={() => setType(eventType)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
                type === eventType
                  ? "border-violet-600 bg-violet-600 text-white shadow-sm shadow-violet-600/25"
                  : "border-stone-200 bg-white hover:border-stone-300 dark:border-stone-700 dark:bg-stone-950 dark:hover:border-stone-600",
              )}
            >
              {formatEventType(eventType)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-stone-200 bg-stone-50/50 p-4 dark:border-stone-800 dark:bg-stone-900/30 sm:grid-cols-2">
        <p className="text-sm font-medium text-stone-600 dark:text-stone-300 sm:col-span-2">
          Details <span className="font-normal text-stone-400">(all optional)</span>
        </p>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Event name</Label>
          <Input id="name" name="name" placeholder="Auto-generated from your description" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" placeholder="Lagos, Nigeria" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="audience_size">Expected audience</Label>
          <Input id="audience_size" name="audience_size" type="number" min={1} placeholder="300" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget_range">Budget range</Label>
          <Input id="budget_range" name="budget_range" placeholder="$2,000 - $5,000" />
        </div>
      </div>

      {isPending ? (
        <div className="rounded-xl border border-violet-200 bg-violet-50/80 p-4 dark:border-violet-900 dark:bg-violet-950/30">
          <p className="flex items-center gap-2 text-sm font-medium text-violet-900 dark:text-violet-100">
            <Loader2 className="h-4 w-4 animate-spin" />
            Building your checklist…
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {LOADING_CATEGORIES.map((cat, i) => (
              <span
                key={cat}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-2.5 py-1 text-xs dark:border-violet-800 dark:bg-violet-950/50",
                  i === 0 && "animate-pulse-soft",
                )}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                {formatCategory(cat)}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <ErrorMessage message={error} /> : null}

      <Button
        type="submit"
        size="lg"
        className="w-full shadow-sm shadow-violet-600/20 sm:w-auto"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Building your checklists...
          </>
        ) : (
          "Generate my checklists"
        )}
      </Button>
    </form>
  );
}

function FormFields({
  event,
  type,
  setType,
  showAll,
}: {
  event: Event;
  type: Event["type"];
  setType: (t: Event["type"]) => void;
  showAll?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="name">Event name</Label>
        <Input id="name" name="name" defaultValue={event.name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Event type</Label>
        <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map((eventType) => (
              <SelectItem key={eventType} value={eventType}>
                {formatEventType(eventType)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showAll ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" defaultValue={event.date ?? undefined} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" defaultValue={event.location ?? undefined} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audience_size">Expected audience</Label>
            <Input
              id="audience_size"
              name="audience_size"
              type="number"
              min={1}
              defaultValue={event.audience_size ?? undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget_range">Budget range</Label>
            <Input
              id="budget_range"
              name="budget_range"
              placeholder="$2,000 - $5,000"
              defaultValue={event.budget_range ?? undefined}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={event.notes ?? undefined} />
          </div>
        </>
      ) : null}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
      {message}
    </p>
  );
}
