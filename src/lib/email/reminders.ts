import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { formatCategory } from "@/lib/format";
import type { Task } from "@/lib/types";

type ReminderCandidate = {
  userId: string;
  email: string;
  name: string | null;
  task: Task;
  eventName: string;
  eventId: string;
  type: "due_soon" | "overdue";
};

export async function runDeadlineReminders(): Promise<{ sent: number; skipped: number }> {
  const supabase = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("email_reminders", true);

  if (!prefs?.length) return { sent: 0, skipped: 0 };

  let sent = 0;
  let skipped = 0;

  for (const pref of prefs) {
    const { data: user } = await supabase
      .from("users")
      .select("email, name")
      .eq("clerk_id", pref.user_id)
      .maybeSingle();

    const email = user?.email;
    if (!email) {
      skipped++;
      continue;
    }

    const { data: ownedEvents } = await supabase
      .from("events")
      .select("id, name")
      .eq("user_id", pref.user_id)
      .neq("status", "archived");

    const { data: memberships } = await supabase
      .from("event_members")
      .select("event_id")
      .eq("user_id", pref.user_id);

    const memberIds = (memberships ?? [])
      .map((m) => m.event_id)
      .filter((id) => !(ownedEvents ?? []).some((e) => e.id === id));

    let memberEvents: { id: string; name: string }[] = [];
    if (memberIds.length) {
      const { data } = await supabase
        .from("events")
        .select("id, name")
        .in("id", memberIds)
        .neq("status", "archived");
      memberEvents = data ?? [];
    }

    const events = [...(ownedEvents ?? []), ...memberEvents];
    if (!events.length) continue;

    const eventMap = Object.fromEntries(events.map((e) => [e.id, e.name]));
    const eventIds = events.map((e) => e.id);

    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .in("event_id", eventIds)
      .neq("status", "completed")
      .not("due_date", "is", null);

    const candidates: ReminderCandidate[] = [];

    for (const task of tasks ?? []) {
      if (task.parent_id) continue;
      const due = new Date(`${task.due_date}T23:59:59`);
      const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86400000);

      let type: ReminderCandidate["type"] | null = null;
      if (diffDays < 0) type = "overdue";
      else if (diffDays <= pref.reminder_days) type = "due_soon";

      if (!type) continue;

      candidates.push({
        userId: pref.user_id,
        email,
        name: user?.name ?? null,
        task: task as Task,
        eventName: eventMap[task.event_id] ?? "Your event",
        eventId: task.event_id,
        type,
      });
    }

    if (!candidates.length) continue;

    const toSend: ReminderCandidate[] = [];
    for (const c of candidates) {
      const { data: existing } = await supabase
        .from("reminder_log")
        .select("id")
        .eq("user_id", c.userId)
        .eq("task_id", c.task.id)
        .eq("reminder_type", c.type)
        .maybeSingle();

      if (!existing) toSend.push(c);
    }

    if (!toSend.length) continue;

    const overdue = toSend.filter((c) => c.type === "overdue");
    const dueSoon = toSend.filter((c) => c.type === "due_soon");

    const lines: string[] = [];
    if (overdue.length) {
      lines.push("<h3>Overdue</h3><ul>");
      for (const c of overdue) {
        lines.push(
          `<li><strong>${c.eventName}</strong> — ${formatCategory(c.task.category)}: ${c.task.title} (due ${c.task.due_date})</li>`,
        );
      }
      lines.push("</ul>");
    }
    if (dueSoon.length) {
      lines.push("<h3>Due soon</h3><ul>");
      for (const c of dueSoon) {
        lines.push(
          `<li><strong>${c.eventName}</strong> — ${formatCategory(c.task.category)}: ${c.task.title} (due ${c.task.due_date})</li>`,
        );
      }
      lines.push("</ul>");
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://eventplanner-black.vercel.app";
    const ok = await sendEmail({
      to: email,
      subject: `EventPlanner — ${toSend.length} task${toSend.length === 1 ? "" : "s"} need attention`,
      html: `<p>Hi ${candidates[0].name ?? "there"},</p>${lines.join("")}<p><a href="${appUrl}/dashboard">Open EventPlanner</a></p>`,
    });

    if (ok) {
      for (const c of toSend) {
        await supabase.from("reminder_log").insert({
          user_id: c.userId,
          task_id: c.task.id,
          reminder_type: c.type,
        });
      }
      sent++;
    } else {
      skipped++;
    }
  }

  return { sent, skipped };
}
