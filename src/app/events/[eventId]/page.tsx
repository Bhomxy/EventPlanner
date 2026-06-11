import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ChecklistView } from "@/components/checklists/checklist-view";
import { EventStatusBar } from "@/components/events/event-status-bar";
import { PlanSummaryEditor } from "@/components/events/plan-summary-editor";
import { PlanSourceBadge } from "@/components/events/plan-source-badge";
import { SaveAsTemplateButton } from "@/components/events/save-as-template-button";
import { CopyChecklistButton } from "@/components/events/copy-checklist-button";
import { EventAiChat } from "@/components/ai/event-ai-chat";
import { CountdownBadge } from "@/components/layout/event-sidebar";
import {
  getDashboardStats,
  getEventForUser,
  getEventMembers,
  getTasks,
} from "@/lib/events/queries";
import { formatEventDate, formatEventType } from "@/lib/format";
import { EventCardMenu } from "@/components/events/event-actions";
import { ShareEventButton } from "@/components/events/share-event-button";
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
          <PlanSourceBadge event={event} />
          <CountdownBadge date={event.date} />
          {event.date ? (
            <span className="text-xs text-stone-500">{formatEventDate(event.date)}</span>
          ) : null}
        </div>
        <div className="flex items-start justify-between gap-2">
          <h1 className="font-display text-balance text-2xl font-semibold tracking-tight">
            {event.name}
          </h1>
          <div className="flex shrink-0 items-center gap-1.5">
            <ShareEventButton eventId={eventId} shareToken={event.share_token} />
            <EventCardMenu eventId={eventId} />
          </div>
        </div>
        {event.location ? (
          <p className="mt-1 text-sm text-stone-500">{event.location}</p>
        ) : null}
      </div>

      <EventStatusBar event={event} stats={stats} eventId={eventId} />

      <EventAiChat eventId={eventId} />

      <ChecklistView
        key={tasks.map((t) => `${t.id}-${t.status}-${t.title}-${t.due_date}`).join(",")}
        eventId={eventId}
        tasks={tasks}
        members={members}
      />

      <PlanSummaryEditor eventId={eventId} initialSummary={event.plan_summary} />

      <div className="flex flex-wrap gap-3 border-t border-[var(--border)] pt-6">
        <p className="w-full text-xs font-medium text-stone-500">More tools</p>
        <SaveAsTemplateButton eventId={eventId} eventName={event.name} />
        <CopyChecklistButton eventId={eventId} />
        <Button asChild variant="outline" size="sm">
          <a href={`/api/events/${eventId}/calendar`} download>
            Export calendar (.ics)
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/events/${eventId}/budget`}>Budget</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/events/${eventId}/timeline`}>Schedule</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/events/${eventId}/team`}>Team</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/events/${eventId}/tasks`}>Task board</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/events/${eventId}/retrospective`}>Retrospective</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/events/${eventId}/export`}>Post-event export</Link>
        </Button>
      </div>
    </div>
  );
}
