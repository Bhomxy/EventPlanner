import { Check } from "lucide-react";
import { CATEGORY_ICONS, formatCategory } from "@/lib/format";

const MOCK_GROUPS = [
  {
    category: "venue" as const,
    highlight: true,
    items: ["Confirm venue holds 300 seated", "Sign contract & pay deposit", "Check AV and Wi‑Fi"],
  },
  {
    category: "volunteers" as const,
    items: ["Recruit registration desk team", "Brief volunteers on run sheet"],
  },
  {
    category: "marketing" as const,
    items: ["Open registration page", "Announce on community channels"],
  },
];

export function ChecklistPreview() {
  return (
    <div className="surface-card relative overflow-hidden rounded-2xl p-5 sm:p-6">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-violet-700 dark:text-violet-300">
              Your checklist
            </p>
            <p className="font-display text-lg font-semibold">Lagos AI Meetup</p>
          </div>
          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800 dark:bg-violet-950 dark:text-violet-200">
            12% done
          </span>
        </div>

        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
          <div className="h-full w-[12%] rounded-full bg-violet-600" />
        </div>

        <div className="space-y-3">
          {MOCK_GROUPS.map((group) => (
            <div
              key={group.category}
              className={
                group.highlight
                  ? "rounded-xl border border-violet-200 bg-violet-50/80 p-3 dark:border-violet-900 dark:bg-violet-950/40"
                  : "rounded-xl border border-stone-200/80 p-3 dark:border-stone-800"
              }
            >
              <div className="mb-2 flex items-center gap-2">
                <span>{CATEGORY_ICONS[group.category]}</span>
                <span className="text-sm font-semibold">
                  {formatCategory(group.category)}
                  {group.highlight ? (
                    <span className="ml-2 text-xs font-normal text-violet-600 dark:text-violet-400">
                      Start here
                    </span>
                  ) : null}
                </span>
              </div>
              <ul className="space-y-2">
                {group.items.map((item, i) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-400">
                    <span
                      className={
                        group.highlight && i === 0
                          ? "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-violet-400 bg-violet-600 text-white"
                          : "mt-0.5 h-4 w-4 shrink-0 rounded border border-stone-300 dark:border-stone-600"
                      }
                    >
                      {group.highlight && i === 0 ? <Check className="h-2.5 w-2.5" /> : null}
                    </span>
                    <span className={group.highlight && i === 0 ? "line-through opacity-60" : undefined}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
