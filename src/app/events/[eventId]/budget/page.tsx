import { auth } from "@clerk/nextjs/server";
import { BudgetTable } from "@/components/budget/budget-table";
import { getBudgetItems, getEventForUser } from "@/lib/events/queries";

type BudgetPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function BudgetPage({ params }: BudgetPageProps) {
  const { userId } = await auth();
  if (!userId) return null;

  const { eventId } = await params;
  const event = await getEventForUser(eventId, userId);
  if (!event) return null;

  const items = await getBudgetItems(eventId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Budget</h1>
        <p className="text-sm text-zinc-500">
          Track estimated vs actual spending and sponsorship income
        </p>
        {event.budget_range ? (
          <p className="mt-1 text-sm">Target range: {event.budget_range}</p>
        ) : null}
      </div>
      <BudgetTable eventId={eventId} items={items} currency={event.currency} />
    </div>
  );
}
