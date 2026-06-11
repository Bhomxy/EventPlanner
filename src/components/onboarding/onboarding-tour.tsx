"use client";

import { useEffect, useState } from "react";
import { updateUserPreferences } from "@/lib/events/actions";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    title: "Create your event",
    body: "Describe any event — wedding, party, conference, fundraiser — and get a venue-first checklist, schedule, and budget.",
  },
  {
    title: "Work the checklist",
    body: "Check off tasks, add vendor contacts, and use the AI assistant to prioritize what matters this week.",
  },
  {
    title: "Share and collaborate",
    body: "Invite your team, share a public link, export to calendar, and download a post-event report when you're done.",
  },
];

type OnboardingTourProps = {
  completed: boolean;
};

export function OnboardingTour({ completed }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(completed);

  useEffect(() => {
    setDismissed(completed);
  }, [completed]);

  if (dismissed) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  async function finish() {
    setDismissed(true);
    await updateUserPreferences({ onboarding_completed: true });
  }

  return (
    <div className="surface-card mb-8 rounded-[var(--radius-xl)] border-[color-mix(in_oklab,var(--brand)_15%,var(--border))] p-5">
      <p className="text-xs font-semibold text-[var(--brand)]">
        Step {step + 1} of {STEPS.length}
      </p>
      <h2 className="font-display mt-1 text-lg font-semibold">{current.title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {current.body}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {!isLast ? (
          <Button type="button" size="sm" onClick={() => setStep(step + 1)}>
            Next
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={finish}>
            Get started
          </Button>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={finish}>
          Skip tour
        </Button>
      </div>
    </div>
  );
}
