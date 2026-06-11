import Link from "next/link";
import { ArrowLeft, CalendarX2 } from "lucide-react";
import { AppLogo } from "@/components/layout/app-logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main-content" className="flex min-h-dvh flex-col">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
        <Link href="/">
          <AppLogo />
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-24 text-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-muted)] text-[var(--brand)]">
          <CalendarX2 className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <p className="tabular-nums text-sm font-semibold text-[var(--brand)]">404</p>
        <h1 className="font-display text-balance mt-2 text-3xl font-semibold tracking-tight">
          This page isn&apos;t on the schedule
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-500 dark:text-stone-400">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved. Head back to
          your events and pick up where you left off.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to my events
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go to homepage</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
