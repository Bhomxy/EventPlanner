import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyEventsState() {
  return (
    <div className="surface-card flex flex-col items-center justify-center rounded-2xl border-dashed px-6 py-20 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-violet-200 text-violet-700 dark:from-violet-950 dark:to-violet-900 dark:text-violet-300">
        <CalendarDays className="h-8 w-8" />
      </div>
      <h3 className="font-display text-xl font-semibold">No events yet</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-500 dark:text-stone-400">
        Describe an event and get your checklist — venue first, then volunteers, marketing, and
        everything else.
      </p>
      <Button asChild className="mt-8 shadow-sm shadow-violet-600/15">
        <Link href="/events/new">
          Plan my first event
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
