import { auth } from "@clerk/nextjs/server";
import { EventForm } from "@/components/events/event-form";
import { EventActions } from "@/components/events/event-actions";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { getEventForUser } from "@/lib/events/queries";
import { getUserPreferencesAction } from "@/lib/events/actions";
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

  let preferences = null;
  try {
    preferences = await getUserPreferencesAction();
  } catch {
    preferences = null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Event settings</h1>
        <p className="text-sm text-stone-500">Edit details, duplicate, or archive</p>
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
      {preferences ? <NotificationSettings preferences={preferences} /> : null}
    </div>
  );
}
