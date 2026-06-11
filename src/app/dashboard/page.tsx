import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Plus } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { DeadlineAlerts } from "@/components/events/deadline-alerts";
import { EmptyEventsState, EventCard } from "@/components/events/event-card";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import type { EventWithProgress } from "@/lib/types";
import { getEventsForUser } from "@/lib/events/queries";
import { getUserPreferencesAction, syncPendingInvites } from "@/lib/events/actions";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    await syncPendingInvites();
  } catch {
    // Non-fatal if sync fails
  }

  let events: EventWithProgress[] = [];
  let error: string | null = null;
  let onboardingCompleted = true;

  try {
    const prefs = await getUserPreferencesAction();
    onboardingCompleted = prefs.onboarding_completed;
  } catch {
    // preferences table may not exist yet
  }

  try {
    events = await getEventsForUser(userId);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load events";
  }

  return (
    <>
      <AppHeader />
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--brand)]">My events</p>
            <h1 className="font-display text-balance mt-1 text-3xl font-semibold tracking-tight sm:text-[2rem]">
              What needs your attention?
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-500 dark:text-stone-400">
              Upcoming events, progress at a glance, and your next open step on every card.
            </p>
          </div>
          <Button asChild>
            <Link href="/events/new">
              <Plus className="h-4 w-4" />
              New event
            </Link>
          </Button>
        </div>

        <OnboardingTour completed={onboardingCompleted} />

        {error ? (
          <div className="rounded-[var(--radius-lg)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
            {error}. Make sure Supabase is configured and migrations are applied.
          </div>
        ) : events.length ? (
          <>
            <DeadlineAlerts events={events} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        ) : (
          <EmptyEventsState />
        )}
      </main>
    </>
  );
}
