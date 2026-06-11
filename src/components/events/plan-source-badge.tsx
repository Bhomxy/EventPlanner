import { Sparkles, LayoutTemplate } from "lucide-react";
import type { Event } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function getPlanSource(event: Pick<Event, "plan_source" | "plan_summary">): "ai" | "template" {
  if (event.plan_source === "ai") return "ai";
  if (event.plan_source === "template") return "template";
  if (event.plan_summary?.startsWith("Note: Built-in template used")) return "template";
  return "ai";
}

export function PlanSourceBadge({
  event,
  className,
}: {
  event: Pick<Event, "plan_source" | "plan_summary">;
  className?: string;
}) {
  const source = getPlanSource(event);
  const isAi = source === "ai";

  return (
    <Badge
      variant={isAi ? "default" : "outline"}
      className={cn("gap-1 font-normal", className)}
    >
      {isAi ? <Sparkles className="h-3 w-3" /> : <LayoutTemplate className="h-3 w-3" />}
      {isAi ? "AI plan" : "Template plan"}
    </Badge>
  );
}
