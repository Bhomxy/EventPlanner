import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyEventsState() {
  return (
    <div className="surface-card flex flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[var(--border)] px-6 py-24 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-muted)] text-[var(--brand)]">
        <CalendarDays className="h-7 w-7" strokeWidth={1.75} />
      </div>
      <h3 className="font-display text-balance text-xl font-semibold">No events yet</h3>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
        Describe an event and get your checklist — venue first, then catering, guests, and everything else.
      </p>
      <Button asChild className="mt-9">
        <Link href="/events/new">
          Plan my first event
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
