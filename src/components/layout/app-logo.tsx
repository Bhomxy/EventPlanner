import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppLogo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5 font-display font-semibold tracking-tight", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-violet-800 text-white shadow-sm shadow-violet-600/30">
        <CalendarDays className="h-4 w-4" />
      </span>
      EventPlanner
    </span>
  );
}
