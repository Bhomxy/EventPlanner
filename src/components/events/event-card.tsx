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
          "h-full border-stone-200/80 transition-all duration-200 dark:border-stone-800",
          "hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-600/5 dark:hover:border-violet-900",
          event.attention_label && "border-l-4 border-l-orange-500 pl-0",
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-base transition-colors group-hover:text-violet-700 dark:group-hover:text-violet-300">
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
              className="w-fit border-orange-300 text-[10px] text-orange-700 dark:border-orange-800 dark:text-orange-300"
            >
              {event.attention_label}
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1 text-sm text-stone-500 dark:text-stone-400">
            <p className="font-medium text-stone-700 dark:text-stone-300">
              {formatEventDate(event.date)}
            </p>
            <p>{getCountdownLabel(event.date)}</p>
            {event.location ? (
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">{event.location}</span>
              </p>
            ) : null}
          </div>

          {event.next_step ? (
            <p className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700 dark:bg-stone-900 dark:text-stone-300">
              <span className="font-medium text-violet-700 dark:text-violet-300">Next:</span>{" "}
              {event.next_step}
            </p>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>
                {event.completed_items} of {event.total_items} complete
              </span>
              <span className="font-medium tabular-nums">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export { EmptyEventsState } from "@/components/events/empty-events-state";
