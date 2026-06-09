"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EventMember } from "@/lib/types";
import { MEMBER_ROLES } from "@/lib/types";
import { inviteTeamMember } from "@/lib/events/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TeamPanel({ eventId, members }: { eventId: string; members: EventMember[] }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof MEMBER_ROLES)[number]>("member");
  const [, startTransition] = useTransition();
  const router = useRouter();

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    startTransition(async () => {
      await inviteTeamMember(eventId, email, role);
      setEmail("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@email.com"
        />
        <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
          <SelectTrigger className="sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MEMBER_ROLES.filter((r) => r !== "owner").map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit">Invite</Button>
      </form>

      <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {members.map((member) => (
          <li key={member.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium">{member.name ?? member.email}</p>
              <p className="text-sm text-zinc-500">{member.email}</p>
            </div>
            <Badge variant="secondary">{member.role}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
