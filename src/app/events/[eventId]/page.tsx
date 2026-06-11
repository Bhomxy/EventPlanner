import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ChecklistView } from "@/components/checklists/checklist-view";
import { EventStatusBar } from "@/components/events/event-status-bar";
import { PlanSummaryEditor } from "@/components/events/plan-summary-editor";
import { CountdownBadge } from "@/components/layout/event-sidebar";
import {
  getDashboardStats,
  getEventForUser,
  getEventMembers,
  getTasks,
} from "@/lib/events/queries";
import { formatEventDate, formatEventType } from "@/lib/format";
import { EventCardMenu } from "@/components/events/event-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type EventDashboardPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function EventDashboardPage({ params }: EventDashboardPageProps) {
  const { userId } = await auth();
  if (!userId) return null;

  const { eventId } = await params;
  const event = await getEventForUser(eventId, userId);
  if (!event) return null;

  const [tasks, stats, members] = await Promise.all([
    getTasks(eventId),
    getDashboardStats(eventId, event),
    getEventMembers(eventId),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge>{formatEventType(event.type)}</Badge>
          <CountdownBadge date={event.date} />
          {event.date ? (
            <span className="text-xs text-zinc-500">{formatEventDate(event.date)}</span>
          ) : null}
        </div>
        <div className="flex items-start justify-between gap-2">
          <h1 className="font-display text-2xl font-bold tracking-tight">{event.name}</h1>
          <EventCardMenu eventId={eventId} />
        </div>
        {event.location ? (
          <p className="mt-1 text-sm text-zinc-500">{event.location}</p>
        ) : null}
      </div>

      <EventStatusBar event={event} stats={stats} eventId={eventId} />

      <ChecklistView
        key={tasks.map((t) => `${t.id}-${t.status}-${t.title}-${t.due_date}`).join(",")}
        eventId={eventId}
        tasks={tasks}
        members={members}
      />

      <PlanSummaryEditor eventId={eventId} initialSummary={event.plan_summary} />

      <div className="flex flex-wrap gap-3 border-t border-zinc-100 pt-6 dark:border-zinc-800">
        <p className="w-full text-xs font-medium uppercase tracking-wide text-zinc-400">
          More tools
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href={`/events/${eventId}/budget`}>Budget</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/events/${eventId}/timeline`}>Run sheet</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/events/${eventId}/team`}>Team</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/events/${eventId}/tasks`}>Board view</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/events/${eventId}/export`}>Post-event export</Link>
        </Button>
      </div>
    </div>
  );
}
