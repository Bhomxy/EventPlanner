import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { EventForm } from "@/components/events/event-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type NewEventPageProps = {
  searchParams: Promise<{ template?: string }>;
};

export default async function NewEventPage({ searchParams }: NewEventPageProps) {
  const { template } = await searchParams;

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 text-stone-500">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to events
          </Link>
        </Button>

        <div className="mb-8">
          <p className="text-sm font-medium text-violet-700 dark:text-violet-300">New event</p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight">What are you planning?</h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
            Describe it in your own words — wedding, party, conference, fundraiser, or anything else.
            We&apos;ll generate a checklist that starts with venue, then catering, guests, and the rest.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Describe your event</CardTitle>
          </CardHeader>
          <CardContent>
            <EventForm mode="create" templateId={template} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
