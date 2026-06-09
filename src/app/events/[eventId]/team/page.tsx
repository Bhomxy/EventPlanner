import { auth } from "@clerk/nextjs/server";
import { TeamPanel } from "@/components/team/team-panel";
import { getEventForUser, getEventMembers } from "@/lib/events/queries";

type TeamPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function TeamPage({ params }: TeamPageProps) {
  const { userId } = await auth();
  if (!userId) return null;

  const { eventId } = await params;
  const event = await getEventForUser(eventId, userId);
  if (!event) return null;

  const members = await getEventMembers(eventId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-sm text-zinc-500">
          Invite volunteers and assign roles for collaboration
        </p>
      </div>
      <TeamPanel eventId={eventId} members={members} />
    </div>
  );
}
