import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { AppHeader } from "@/components/layout/app-header";
import { EventSidebar } from "@/components/layout/event-sidebar";
import { getEventForUser } from "@/lib/events/queries";
import { syncPendingInvites } from "@/lib/events/actions";

type EventLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
};

export default async function EventLayout({ children, params }: EventLayoutProps) {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    await syncPendingInvites();
  } catch {
    // Non-fatal
  }

  const { eventId } = await params;
  const event = await getEventForUser(eventId, userId);
  if (!event) notFound();

  return (
    <>
      <AppHeader />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col lg:flex-row">
        <EventSidebar eventId={eventId} eventName={event.name} />
        <div className="flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</div>
      </div>
    </>
  );
}
