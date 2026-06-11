import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, CheckSquare, MapPin } from "lucide-react";
import { ChecklistPreview } from "@/components/marketing/checklist-preview";
import { AppLogo } from "@/components/layout/app-logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const benefits = [
  "Describe your event in plain English",
  "Get a venue-first checklist tailored to you",
  "Track budget, schedule, and team as you go",
];

export default async function HomePage() {
  const { userId } = await auth();
  const ctaHref = userId ? "/events/new" : "/sign-up";
  const ctaLabel = userId ? "Plan my first event" : "Plan my first event — free";

  return (
    <main id="main-content" className="flex-1">
      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 sm:px-6">
        <header className="glass-panel sticky top-0 z-40 -mx-4 flex h-16 items-center justify-between border-x-0 border-t-0 px-4 sm:-mx-6 sm:px-6">
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

        <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
          <div className="animate-fade-up max-w-[34rem]">
            <p className="mb-5 text-sm font-medium text-[var(--brand-foreground)] dark:text-[var(--brand)]">
              For meetups, hackathons, and workshops
            </p>
            <h1 className="font-display text-balance text-[2.5rem] font-semibold leading-[1.06] sm:text-5xl lg:text-[3.35rem]">
              Describe your event.
              <span className="mt-1 block text-[var(--brand)]">
                Get a checklist that starts with venue.
              </span>
            </h1>
            <p className="mt-6 max-w-[36ch] text-[1.0625rem] leading-[1.65] text-stone-600 dark:text-stone-400">
              Tell us what you&apos;re planning and we&apos;ll build a step-by-step plan you can
              edit, share, and work through with your team.
            </p>

            <ul className="mt-9 space-y-3.5">
              {benefits.map((item, i) => (
                <li
                  key={item}
                  className={cn(
                    "animate-fade-up flex items-start gap-3 text-[0.9375rem] text-stone-700 dark:text-stone-300",
                    i === 1 && "animate-fade-up-delay-1",
                    i === 2 && "animate-fade-up-delay-2",
                  )}
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-muted)] text-[var(--brand)]">
                    <CheckSquare className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg">
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

            <p className="mt-7 flex items-center gap-2 text-xs text-stone-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              Venue first — then volunteers, marketing, and launch day.
            </p>
          </div>

          <div className="animate-fade-up animate-fade-up-delay-2 lg:-mr-2 lg:translate-y-3 lg:justify-self-end">
            <ChecklistPreview />
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] py-9 text-xs text-stone-500 sm:flex-row">
          <p>© {new Date().getFullYear()} EventPlanner</p>
          <nav className="flex items-center gap-6">
            <Link
              href="/templates"
              className="interactive text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            >
              Templates
            </Link>
            <Link
              href="/sign-in"
              className="interactive text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="interactive text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            >
              Get started
            </Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
