import Link from "next/link";
import { MapPin } from "lucide-react";
import type { EventWithProgress } from "@/lib/types";
import {
  formatEventDate,
  formatEventType,
  getCountdownLabel,
  getProgressPercent,
} from "@/lib/format";
import { EventCardMenu } from "@/components/events/event-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type EventCardProps = {
  event: EventWithProgress;
};

export function EventCard({ event }: EventCardProps) {
  const progress = getProgressPercent(event.completed_items, event.total_items);

  return (
    <Link href={`/events/${event.id}`} className="group block h-full">
      <Card
        className={cn(
          "interactive flex h-full flex-col border-[var(--border)]",
          "hover:-translate-y-1 hover:border-[color-mix(in_oklab,var(--brand)_20%,var(--border))] hover:shadow-[0_8px_28px_-8px_rgb(var(--shadow-color)/0.12),0_0_0_1px_color-mix(in_oklab,var(--brand)_8%,transparent)]",
          event.attention_label && "border-l-[3px] border-l-amber-600 pl-0 dark:border-l-amber-500",
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-base font-semibold transition-colors group-hover:text-[var(--brand)]">
              {event.name}
            </CardTitle>
            <div className="flex shrink-0 items-center gap-1">
              <Badge variant="secondary" className="font-normal">
                {formatEventType(event.type)}
              </Badge>
              <EventCardMenu eventId={event.id} />
            </div>
          </div>
          {event.attention_label ? (
            <Badge
              variant="outline"
              className="w-fit border-amber-300/80 text-[10px] text-amber-800 dark:border-amber-800 dark:text-amber-300"
            >
              {event.attention_label}
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-1 flex-col space-y-4">
          <div className="space-y-1 text-sm text-stone-500 dark:text-stone-400">
            <p className="font-medium text-stone-800 dark:text-stone-200">
              {formatEventDate(event.date)}
            </p>
            <p>{getCountdownLabel(event.date)}</p>
            {event.location ? (
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="line-clamp-1">{event.location}</span>
              </p>
            ) : null}
          </div>

          {event.next_step ? (
            <p className="rounded-[var(--radius-md)] bg-[var(--surface-muted)] px-3 py-2.5 text-sm text-stone-700 dark:text-stone-300">
              <span className="font-semibold text-[var(--brand)]">Next</span>{" "}
              {event.next_step}
            </p>
          ) : (
            <div className="flex-1" />
          )}

          <div className="mt-auto space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>
                {event.completed_items} of {event.total_items} complete
              </span>
              <span className="tabular-nums font-semibold text-stone-700 dark:text-stone-300">
                {progress}%
              </span>
            </div>
            <Progress value={progress} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export { EmptyEventsState } from "@/components/events/empty-events-state";
