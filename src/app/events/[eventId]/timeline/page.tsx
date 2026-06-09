import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { TimelineEditor } from "@/components/timeline/timeline-editor";
import { getEventForUser, getTimelineItems } from "@/lib/events/queries";
import { Button } from "@/components/ui/button";

type TimelinePageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function TimelinePage({ params }: TimelinePageProps) {
  const { userId } = await auth();
  if (!userId) return null;

  const { eventId } = await params;
  const event = await getEventForUser(eventId, userId);
  if (!event) return null;

  const items = await getTimelineItems(eventId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Run sheet</h1>
          <p className="text-sm text-zinc-500">Hour-by-hour event-day timeline — edit times and blocks</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/events/${eventId}/timeline/print`}>Print view</Link>
        </Button>
      </div>
      <TimelineEditor eventId={eventId} items={items} />
    </div>
  );
}
