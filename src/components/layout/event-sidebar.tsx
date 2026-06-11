"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CheckSquare,
  Clock,
  DollarSign,
  ListChecks,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "", label: "Task list", icon: ListChecks },
  { href: "/tasks", label: "Task board", icon: CheckSquare },
  { href: "/budget", label: "Budget", icon: DollarSign },
  { href: "/timeline", label: "Schedule", icon: Clock },
  { href: "/team", label: "Team", icon: Users },
  { href: "/edit", label: "Settings", icon: Settings },
];

type EventSidebarProps = {
  eventId: string;
  eventName: string;
};

export function EventSidebar({ eventId, eventName }: EventSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="glass-panel w-full shrink-0 border-x-0 border-t-0 lg:w-56 lg:border-b-0 lg:border-r">
      <div className="p-4 lg:p-5">
        <Link
          href="/dashboard"
          className="interactive text-xs font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
        >
          ← All events
        </Link>
        <h2 className="font-display mt-3 line-clamp-2 text-sm font-semibold leading-snug">
          {eventName}
        </h2>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-3 lg:flex-col lg:px-3 lg:pb-6">
        {links.map(({ href, label, icon: Icon }) => {
          const path = `/events/${eventId}${href}`;
          const active =
            href === ""
              ? pathname === `/events/${eventId}`
              : pathname.startsWith(path);
          return (
            <Link
              key={href}
              href={path}
              className={cn(
                "interactive flex items-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium",
                active
                  ? "bg-[var(--brand-muted)] text-[var(--brand-foreground)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--brand)_12%,transparent)] dark:text-[var(--brand)]"
                  : "text-stone-600 hover:bg-stone-100/80 dark:text-stone-400 dark:hover:bg-stone-900/60",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={active ? 2.25 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function CountdownBadge({ date }: { date: string | null }) {
  if (!date) {
    return (
      <span className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-stone-100 px-2.5 py-1 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">
        <Calendar className="h-3.5 w-3.5" />
        No date set
      </span>
    );
  }

  const eventDate = new Date(`${date}T12:00:00`);
  const days = Math.ceil((eventDate.getTime() - Date.now()) / 86400000);
  const label =
    days < 0
      ? "Event passed"
      : days === 0
        ? "Today"
        : `${days} day${days === 1 ? "" : "s"} left`;

  return (
    <span className="tabular-nums inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--brand-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-foreground)] dark:text-[var(--brand)]">
      <Calendar className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
