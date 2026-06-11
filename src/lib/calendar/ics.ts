import type { Event, Task, TimelineItem } from "@/lib/types";

function escapeIcs(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function formatIcsDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function formatIcsDateOnly(date: string) {
  return date.replace(/-/g, "");
}

export function buildEventCalendarIcs(
  event: Event,
  tasks: Task[],
  timeline: TimelineItem[],
): string {
  const uid = event.id.replace(/-/g, "");
  const now = formatIcsDate(new Date().toISOString());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventPlanner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:" + escapeIcs(event.name),
  ];

  if (event.date) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}-event@eventplanner`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${formatIcsDateOnly(event.date)}`,
      `DTEND;VALUE=DATE:${formatIcsDateOnly(event.date)}`,
      `SUMMARY:${escapeIcs(event.name)}`,
      ...(event.location ? [`LOCATION:${escapeIcs(event.location)}`] : []),
      `DESCRIPTION:${escapeIcs(`Main event day for ${event.name}`)}`,
      "END:VEVENT",
    );
  }

  for (const item of timeline) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${item.id}@eventplanner`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatIcsDate(item.start_time)}`,
      `DTEND:${formatIcsDate(item.end_time)}`,
      `SUMMARY:${escapeIcs(item.title)}`,
      ...(item.description ? [`DESCRIPTION:${escapeIcs(item.description)}`] : []),
      "END:VEVENT",
    );
  }

  for (const task of tasks.filter((t) => t.due_date && t.status !== "completed")) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${task.id}@eventplanner`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${formatIcsDateOnly(task.due_date!)}`,
      `DTEND;VALUE=DATE:${formatIcsDateOnly(task.due_date!)}`,
      `SUMMARY:${escapeIcs(`Due: ${task.title}`)}`,
      `DESCRIPTION:${escapeIcs(`Task due — ${task.title}`)}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
