import * as React from "react";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number }
>(({ className, value = 0, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative h-1.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800",
      className,
    )}
    {...props}
  >
    <div
      className="h-full rounded-full bg-[var(--brand)] transition-all duration-500 ease-out"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
));
Progress.displayName = "Progress";

export { Progress };
