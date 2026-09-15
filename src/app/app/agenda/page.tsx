import { addBaptismName } from "@/app/actions/admin";
import { submitJustification } from "@/app/actions/member";
import { EmptyState, Flash } from "@/components/flash";
import { areaClass, controlClass } from "@/components/field";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { formatDateTime, formatDayLong } from "@/lib/dates";
import { isLinkActive } from "@/lib/links";
import { canUseCoordinatorPanel } from "@/lib/permissions";
import { requirePerson } from "@/lib/session";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  const person = await requirePerson();
  const params = await searchParams;
  const now = new Date();

  const [scale, events, links] = await Promise.all([
    prisma.scaleEntry.findMany({
      where: { personId: person.id, occurrence: { date: { gte: now }, cancelled: false } },
      include: {
        occurrence: {
          include: {
            series: { include: { institution: true } },
            justifications: { where: { personId: person.id } },
          },
        },
      },
      orderBy: { occurrence: { date: "asc" } },
    }),
    prisma.regionalEvent.findMany({
      where: { startsAt: { gte: now }, cancelled: false },
      include: { type: true, attendances: { where: { personId: person.id } }, baptisms: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.institutionLink.findMany({
      where: { personId: person.id },
      include: { institution: true },
    }),
  ]);

  const activeLinks = links.filter(isLinkActive);
  const institutionScales =
    activeLinks.length === 0
      ? []
      : await prisma.occurrence.findMany({
          where: {
            cancelled: false,
            date: { gte: now },
            series: { institutionId: { in: activeLinks.map((link) => link.institutionId) } },
          },
          include: {
            series: { include: { institution: true } },
            scale: { include: { person: true } },
          },
          orderBy: { date: "asc" },
          take: 24,
        });

  const visibleEvents = events.filter((event) => event.mandatory || scale.length > 0 || links.length > 0);
  const canRecordBaptism = canUseCoordinatorPanel(person);

  return (
    <div>
      <h1 className="mb-2 font-heading text-3xl">Agenda</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Evento obrigatório aparece para toda a regional. Quem tem vínculo vê a escala da instituição. Justificativa tem
        prazo padrão de dois dias antes, configurável na série.
      </p>
      <Flash erro={params.erro} ok={params.ok} />

      <section className="mb-10">
        <h2 className="mb-3 text-xl">Atendimentos</h2>
        {scale.length === 0 ? (
          <EmptyState
            title="Você não está escalado"
            description="Quando a coordenação incluir seu nome, o atendimento aparece aqui."
          />
        ) : (
          <div className="grid gap-3">
            {scale.map((entry) => {
              const justification = entry.occurrence.justifications[0];
              return (
                <div key={entry.id} className="rounded-xl border border-border p-4">
                  <p className="font-medium">{entry.occurrence.series.institution.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">{formatDayLong(entry.occurrence.date)}</p>
                  {justification ? (
                    <p className="mt-2 text-sm">Justificativa enviada: {justification.reason}</p>
                  ) : (
                    <form action={submitJustification} className="mt-3 grid gap-2">
                      <input type="hidden" name="occurrenceId" value={entry.occurrenceId} />
                      <textarea className={areaClass} name="reason" placeholder="Motivo da ausência" required />
                      <Button type="submit" variant="outline">
                        Enviar justificativa
                      </Button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {institutionScales.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-3 text-xl">Escala das instituições vinculadas</h2>
          <div className="grid gap-3">
            {institutionScales.map((occurrence) => (
              <div key={occurrence.id} className="rounded-xl border border-border p-4">
                <p className="font-medium">{occurrence.series.institution.name}</p>
                <p className="text-sm text-muted-foreground capitalize">{formatDayLong(occurrence.date)}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {occurrence.scale.length === 0
                    ? "Escala ainda vazia."
                    : occurrence.scale.map((entry) => entry.person.name).join(", ")}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-xl">Eventos da regional</h2>
        {visibleEvents.length === 0 ? (
          <EmptyState title="Nenhum evento à frente" description="Reuniões, ensaios e batismos aparecerão aqui." />
        ) : (
          <div className="grid gap-3">
            {visibleEvents.map((event) => {
              const isBaptism = event.type.name.toLowerCase().includes("batismo");
              return (
                <div key={event.id} className="rounded-xl border border-border p-4">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(event.startsAt)} · {event.location}
                    {event.mandatory ? " · obrigatório" : ""}
                  </p>
                  {event.attendances.length > 0 ? (
                    <p className="mt-2 text-sm text-primary">Presença registrada.</p>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      A presença deste evento é pelo QR no local, com login válido
                      {event.latitude != null && event.longitude != null ? " e localização compatível" : ""}.
                    </p>
                  )}
                  {isBaptism ? (
                    <div className="mt-3">
                      <p className="text-sm font-medium">Batizandos</p>
                      <ul className="mt-1 text-sm text-muted-foreground">
                        {event.baptisms.length === 0 ? (
                          <li>Nenhum nome lançado.</li>
                        ) : (
                          event.baptisms.map((item) => <li key={item.id}>{item.fullName}</li>)
                        )}
                      </ul>
                      {canRecordBaptism ? (
                        <form action={addBaptismName} className="mt-2 flex gap-2">
                          <input type="hidden" name="eventId" value={event.id} />
                          <input type="hidden" name="from" value="/app/agenda" />
                          <input className={controlClass} name="fullName" placeholder="Nome completo" required />
                          <Button type="submit" variant="outline">
                            Incluir nome
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
