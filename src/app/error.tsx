"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { AppLogo } from "@/components/layout/app-logo";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="flex min-h-dvh flex-col">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
        <Link href="/">
          <AppLogo />
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-24 text-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300">
          <AlertTriangle className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <h1 className="font-display text-balance text-3xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-500 dark:text-stone-400">
          An unexpected error occurred while loading this page. Try again — if the problem
          continues, check your connection or come back later.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-stone-400 dark:text-stone-600">
            Error ID: {error.digest}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to my events</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
