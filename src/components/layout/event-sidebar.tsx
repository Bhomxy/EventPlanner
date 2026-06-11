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
    <aside className="w-full shrink-0 border-b border-stone-200/80 bg-white/90 dark:border-stone-800 dark:bg-stone-950/90 lg:w-56 lg:border-b-0 lg:border-r">
      <div className="p-4 lg:p-5">
        <Link
          href="/dashboard"
          className="text-xs font-medium text-stone-500 transition-colors hover:text-stone-800 dark:hover:text-stone-200"
        >
          ← All events
        </Link>
        <h2 className="font-display mt-3 line-clamp-2 text-sm font-semibold">{eventName}</h2>
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
                "flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-violet-100 text-violet-900 shadow-sm dark:bg-violet-950 dark:text-violet-100"
                  : "text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-900",
              )}
            >
              <Icon className="h-4 w-4" />
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
      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs dark:bg-zinc-800">
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
        ? "Today!"
        : `${days} day${days === 1 ? "" : "s"} left`;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-800 dark:bg-violet-950 dark:text-violet-200">
      <Calendar className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
