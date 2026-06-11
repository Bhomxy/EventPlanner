import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center gap-2.5 font-display text-[0.9375rem] font-semibold tracking-tight",
        className,
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand)] text-white shadow-[0_2px_8px_-2px_color-mix(in_oklab,var(--brand)_50%,transparent)]">
        <CalendarDays className="h-4 w-4" strokeWidth={2} />
      </span>
      EventPlanner
    </span>
  );
}
