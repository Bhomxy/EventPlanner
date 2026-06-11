import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { AppHeader } from "@/components/layout/app-header";
import type { Template } from "@/lib/types";
import { getTemplates } from "@/lib/events/queries";
import { formatEventType } from "@/lib/format";
import { TemplatePreview } from "@/components/templates/template-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TemplatesPage() {
  const { userId } = await auth();
  if (!userId) return null;

  let templates: Template[] = [];
  try {
    templates = await getTemplates();
  } catch {
    templates = [];
  }

  const mine = templates.filter((t) => t.user_id === userId);
  const builtIn = templates.filter((t) => !t.user_id);

  function TemplateGrid({ items }: { items: Template[] }) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{template.name}</CardTitle>
                <Badge variant="secondary">{formatEventType(template.event_type)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-stone-500">
                {template.description ?? "Pre-built tasks, timeline, and budget."}
              </p>
              <TemplatePreview template={template} />
              <Button asChild variant="secondary" className="w-full">
                <Link href={`/events/new?template=${template.id}`}>Use template</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <AppHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Event templates</h1>
          <p className="mt-1 text-sm text-stone-500">
            Start from a built-in playbook or one you saved from a past event
          </p>
        </div>

        {mine.length ? (
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-semibold text-[var(--brand)]">Your templates</h2>
            <TemplateGrid items={mine} />
          </section>
        ) : null}

        {builtIn.length ? (
          <section>
            <h2 className="mb-4 text-sm font-semibold text-stone-600 dark:text-stone-400">
              Built-in templates
            </h2>
            <TemplateGrid items={builtIn} />
          </section>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-sm text-stone-500">
              No templates found. Run migration{" "}
              <code className="rounded bg-stone-100 px-1 dark:bg-stone-800">002_prd_schema.sql</code>{" "}
              to seed templates, or save an event as a template from its task list page.
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
