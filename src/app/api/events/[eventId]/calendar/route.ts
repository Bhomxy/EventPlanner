import { auth } from "@clerk/nextjs/server";
import { buildEventCalendarIcs } from "@/lib/calendar/ics";
import { getEventForUser, getTasks, getTimelineItems } from "@/lib/events/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { eventId } = await params;
  const event = await getEventForUser(eventId, userId);
  if (!event) return new Response("Not found", { status: 404 });

  const [tasks, timeline] = await Promise.all([
    getTasks(eventId),
    getTimelineItems(eventId),
  ]);

  const ics = buildEventCalendarIcs(event, tasks, timeline);
  const slug =
    event.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40) || "event";

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
    },
  });
}
