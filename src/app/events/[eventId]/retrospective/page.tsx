import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getRetrospectiveData } from "@/lib/events/actions";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type RetrospectivePageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function RetrospectivePage({ params }: RetrospectivePageProps) {
  const { userId } = await auth();
  if (!userId) return null;

  const { eventId } = await params;
  let data;
  try {
    data = await getRetrospectiveData(eventId);
  } catch {
    return null;
  }

  const { event, stats, retrospective } = data;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Retrospective</h1>
          <p className="mt-1 text-sm text-stone-500">
            Auto-generated summary for {event.name}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/events/${eventId}/export`}>Full export</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Executive summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="leading-relaxed text-stone-700 dark:text-stone-300">{retrospective.summary}</p>
          <div>
            <div className="mb-1 flex justify-between text-xs text-stone-500">
              <span>Task completion</span>
              <span className="tabular-nums font-semibold">{retrospective.completionRate}%</span>
            </div>
            <Progress value={retrospective.completionRate} />
          </div>
          <p className="text-stone-600 dark:text-stone-400">
            On-time completion rate:{" "}
            <span className="tabular-nums font-semibold">{retrospective.onTimeRate}%</span>
          </p>
          <p className="text-stone-600 dark:text-stone-400">
            Budget variance:{" "}
            <span className="tabular-nums font-semibold">
              {formatMoney(retrospective.budgetVariance, event.currency)} (
              {retrospective.budgetVariancePercent}%)
            </span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What went well</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-1 text-sm text-stone-600 dark:text-stone-400">
            {retrospective.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Improve next time</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-1 text-sm text-stone-600 dark:text-stone-400">
            {retrospective.improvements.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {stats.risks.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open risks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
              {stats.risks.map((r) => (
                <li key={r.id}>
                  <span className="font-medium">{r.title}</span> — {r.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
