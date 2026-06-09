import { auth } from "@clerk/nextjs/server";
import { TimelineView } from "@/components/timeline/timeline-view";
import { getEventForUser, getTimelineItems } from "@/lib/events/queries";

type PrintTimelinePageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function PrintTimelinePage({ params }: PrintTimelinePageProps) {
  const { userId } = await auth();
  if (!userId) return null;

  const { eventId } = await params;
  const event = await getEventForUser(eventId, userId);
  if (!event) return null;

  const items = await getTimelineItems(eventId);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">{event.name}</h1>
        <p className="text-sm text-zinc-500">Event day run sheet</p>
      </div>
      <TimelineView items={items} readOnly />
    </div>
  );
}
