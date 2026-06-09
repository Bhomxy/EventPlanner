import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Plus } from "lucide-react";
import { AppLogo } from "@/components/layout/app-logo";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/85 backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard">
          <AppLogo />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/dashboard">My events</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/templates">Templates</Link>
          </Button>
          <Button asChild size="sm" className="shadow-sm shadow-violet-600/15">
            <Link href="/events/new">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New event</span>
              <span className="sm:hidden">New</span>
            </Link>
          </Button>
          <UserButton />
        </div>
      </div>
    </header>
  );
}
