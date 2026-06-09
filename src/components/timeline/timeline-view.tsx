import { format } from "date-fns";
import type { TimelineItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TimelineView({
  items,
  readOnly = false,
}: {
  items: TimelineItem[];
  readOnly?: boolean;
}) {
  if (!items.length) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
        No timeline items yet. Generate a plan or add run sheet entries.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {readOnly ? (
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Event day run sheet
        </p>
      ) : null}
      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
            <div>
              <CardTitle className="text-base">{item.title}</CardTitle>
              <p className="mt-1 text-sm text-zinc-500">
                {format(new Date(item.start_time), "h:mm a")} –{" "}
                {format(new Date(item.end_time), "h:mm a")}
              </p>
            </div>
            <Badge variant="secondary">{item.item_type.replace("_", " ")}</Badge>
          </CardHeader>
          {item.description ? (
            <CardContent className="pt-0 text-sm text-zinc-600 dark:text-zinc-400">
              {item.description}
            </CardContent>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
