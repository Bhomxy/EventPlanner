import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, CheckSquare, MapPin, Sparkles } from "lucide-react";
import { ChecklistPreview } from "@/components/marketing/checklist-preview";
import { AppLogo } from "@/components/layout/app-logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const benefits = [
  "Describe your event in plain English",
  "Get a venue-first checklist tailored to you",
  "Check off steps as you go — budget & run sheet when you need them",
];

export default async function HomePage() {
  const { userId } = await auth();
  const ctaHref = userId ? "/events/new" : "/sign-up";
  const ctaLabel = userId ? "Plan my first event" : "Plan my first event — free";

  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-6">
        <header className="flex h-16 items-center justify-between">
          <AppLogo />
          {userId ? (
            <Button asChild variant="outline">
              <Link href="/dashboard">My events</Link>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Get started</Link>
              </Button>
            </div>
          )}
        </header>

        <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-2 lg:py-20">
          <div className="animate-fade-up max-w-xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-sm font-medium text-violet-800 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-200">
              <Sparkles className="h-4 w-4" />
              AI checklists for tech events
            </p>
            <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              Describe your event.
              <span className="block text-violet-700 dark:text-violet-300">Get a checklist that starts with venue.</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-stone-600 dark:text-stone-400">
              Meetups, hackathons, workshops — tell us what you&apos;re planning and we&apos;ll
              build a step-by-step plan you can edit and work through.
            </p>

            <ul className="mt-8 space-y-3">
              {benefits.map((item, i) => (
                <li
                  key={item}
                  className={cn(
                    "animate-fade-up flex items-start gap-3 text-sm text-stone-700 dark:text-stone-300",
                    i === 1 && "animate-fade-up-delay-1",
                    i === 2 && "animate-fade-up-delay-2",
                  )}
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                    <CheckSquare className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-lg shadow-violet-600/20">
                <Link href={ctaHref}>
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {userId ? (
                <Button asChild size="lg" variant="outline">
                  <Link href="/dashboard">View my events</Link>
                </Button>
              ) : (
                <Button asChild size="lg" variant="outline">
                  <Link href="/templates">Browse templates</Link>
                </Button>
              )}
            </div>

            <p className="mt-6 flex items-center gap-2 text-xs text-stone-500">
              <MapPin className="h-3.5 w-3.5" />
              Built for community organizers — venue first, then volunteers, marketing, and more.
            </p>
          </div>

          <div className="animate-fade-up animate-fade-up-delay-2 lg:justify-self-end">
            <ChecklistPreview />
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-stone-200/80 py-8 text-xs text-stone-500 dark:border-stone-800 sm:flex-row">
          <p>© {new Date().getFullYear()} EventPlanner. Built for community organizers.</p>
          <nav className="flex items-center gap-5">
            <Link href="/templates" className="transition-colors hover:text-stone-900 dark:hover:text-stone-200">
              Templates
            </Link>
            <Link href="/sign-in" className="transition-colors hover:text-stone-900 dark:hover:text-stone-200">
              Sign in
            </Link>
            <Link href="/sign-up" className="transition-colors hover:text-stone-900 dark:hover:text-stone-200">
              Get started
            </Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
