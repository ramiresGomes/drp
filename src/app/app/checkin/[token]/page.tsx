import { checkInEvent } from "@/app/actions/member";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/dates";
import { requirePerson } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export default async function CheckinPage({ params }: { params: Promise<{ token: string }> }) {
  await requirePerson();
  const { token } = await params;
  const event = await prisma.regionalEvent.findUnique({ where: { checkinToken: token } });
  if (!event) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-xs tracking-[0.18em] text-primary uppercase">Check-in</p>
      <h1 className="mt-2 font-heading text-3xl">{event.title}</h1>
      <p className="mt-2 text-muted-foreground">
        {formatDateTime(event.startsAt)} · {event.location}
      </p>
      {event.cancelled ? (
        <p className="mt-6 text-destructive">Este evento foi cancelado.</p>
      ) : (
        <form action={checkInEvent} className="mt-6">
          <input type="hidden" name="token" value={token} />
          <Button type="submit">Registrar minha presença</Button>
        </form>
      )}
    </div>
  );
}
