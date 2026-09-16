import { CheckinForm } from "@/components/checkin-form";
import { Flash } from "@/components/flash";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/dates";
import { requirePerson } from "@/lib/session";
import { notFound } from "next/navigation";

export default async function CheckinPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  const person = await requirePerson();
  const { token } = await params;
  const flash = await searchParams;
  const event = await prisma.regionalEvent.findUnique({
    where: { checkinToken: token },
    include: { attendances: { where: { personId: person.id } } },
  });
  if (!event) notFound();
  const already = event.attendances.length > 0;

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-xs tracking-[0.18em] text-primary uppercase">Check-in</p>
      <h1 className="mt-2 font-heading text-3xl">{event.title}</h1>
      <p className="mt-2 text-muted-foreground">
        {formatDateTime(event.startsAt)} · {event.location}
      </p>
      <Flash erro={flash.erro} ok={flash.ok} />
      {event.cancelled ? (
        <p className="mt-6 text-destructive">Este evento foi cancelado.</p>
      ) : already ? (
        <p className="mt-6 text-sm text-primary">Sua presença neste evento já está registrada.</p>
      ) : (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            O QR registra presença de 30 minutos antes do início até {formatDateTime(event.endsAt)}.
          </p>
          <CheckinForm token={token} hasGeofence={event.latitude != null && event.longitude != null} />
        </>
      )}
    </div>
  );
}
