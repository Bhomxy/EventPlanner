"use client";

import { useState } from "react";
import Link from "next/link";
import type { Template } from "@/lib/types";
import type { EventPlan } from "@/lib/ai/schemas/event-plan";
import { CATEGORY_ORDER, formatCategory } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TemplatePreviewProps = {
  template: Template;
};

export function TemplatePreview({ template }: TemplatePreviewProps) {
  const [open, setOpen] = useState(false);
  const payload = template.payload as EventPlan;
  const groups = [...(payload.checklistGroups ?? [])].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
  );

  return (
    <div>
      <Button type="button" variant="outline" className="w-full" onClick={() => setOpen(!open)}>
        {open ? "Hide preview" : "Preview checklist"}
      </Button>
      {open ? (
        <div className="mt-4 space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          {groups.map((group) => (
            <div key={group.category}>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="secondary">{formatCategory(group.category)}</Badge>
                <span className="text-xs text-zinc-500">{group.items.length} steps</span>
              </div>
              <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                {group.items.slice(0, 4).map((item, i) => (
                  <li key={i}>· {item.title}</li>
                ))}
                {group.items.length > 4 ? (
                  <li className="text-xs text-zinc-400">+ {group.items.length - 4} more</li>
                ) : null}
              </ul>
            </div>
          ))}
          <Button asChild className={cn("w-full")}>
            <Link href={`/events/new?template=${template.id}`}>Use this template</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
