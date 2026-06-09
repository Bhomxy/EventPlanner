import { auth } from "@clerk/nextjs/server";
import { EventForm } from "@/components/events/event-form";
import { EventActions } from "@/components/events/event-actions";
import { getEventForUser } from "@/lib/events/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EditEventPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { userId } = await auth();
  if (!userId) return null;

  const { eventId } = await params;
  const event = await getEventForUser(eventId, userId);
  if (!event) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Event settings</h1>
        <p className="text-sm text-zinc-500">Edit details, duplicate, or archive</p>
      </div>
      <EventActions eventId={eventId} />
      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm event={event} mode="edit" />
        </CardContent>
      </Card>
    </div>
  );
}
