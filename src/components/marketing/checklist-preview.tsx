import { Check } from "lucide-react";
import { CATEGORY_ICONS, formatCategory } from "@/lib/format";

const MOCK_GROUPS = [
  {
    category: "venue" as const,
    highlight: true,
    items: ["Confirm venue holds 280 seated", "Sign contract & pay deposit", "Check AV and Wi‑Fi"],
  },
  {
    category: "volunteers" as const,
    items: ["Recruit registration desk team", "Brief volunteers on schedule"],
  },
  {
    category: "marketing" as const,
    items: ["Open registration page", "Announce on community channels"],
  },
];

export function ChecklistPreview() {
  return (
    <div className="surface-card relative overflow-hidden rounded-[var(--radius-xl)] p-5 sm:p-6">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--brand) 18%, transparent) 0%, transparent 70%)",
        }}
      />
      <div className="relative">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-stone-500">Sample checklist</p>
            <p className="font-display mt-0.5 text-lg font-semibold">Berlin Dev Night</p>
          </div>
          <span className="tabular-nums rounded-[var(--radius-sm)] bg-[var(--brand-muted)] px-2 py-1 text-xs font-semibold text-[var(--brand-foreground)]">
            18% done
          </span>
        </div>

        <div className="mb-4 h-1 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
          <div
            className="h-full rounded-full bg-[var(--brand)] transition-all duration-500"
            style={{ width: "18%" }}
          />
        </div>

        <div className="space-y-2.5">
          {MOCK_GROUPS.map((group) => (
            <div
              key={group.category}
              className={
                group.highlight
                  ? "rounded-[var(--radius-lg)] border border-[color-mix(in_oklab,var(--brand)_22%,var(--border))] bg-[var(--brand-muted)]/50 p-3"
                  : "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)]/50 p-3"
              }
            >
              <div className="mb-2 flex items-center gap-2">
                <span>{CATEGORY_ICONS[group.category]}</span>
                <span className="text-sm font-semibold">
                  {formatCategory(group.category)}
                  {group.highlight ? (
                    <span className="ml-2 text-xs font-normal text-[var(--brand)]">
                      Start here
                    </span>
                  ) : null}
                </span>
              </div>
              <ul className="space-y-2">
                {group.items.map((item, i) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-stone-600 dark:text-stone-400"
                  >
                    <span
                      className={
                        group.highlight && i === 0
                          ? "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-[var(--brand)] bg-[var(--brand)] text-white"
                          : "mt-0.5 h-4 w-4 shrink-0 rounded-[3px] border border-stone-300 dark:border-stone-600"
                      }
                    >
                      {group.highlight && i === 0 ? (
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      ) : null}
                    </span>
                    <span
                      className={
                        group.highlight && i === 0 ? "line-through opacity-55" : undefined
                      }
                    >
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
