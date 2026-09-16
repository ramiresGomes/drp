import { notFound } from "next/navigation";
import {
  addOccurrenceNote,
  addScaleEntry,
  attachOccurrencePhoto,
  cancelOccurrence,
  closeOccurrence,
  markParticipation,
  removeScaleEntry,
  requestReopenAttendance,
} from "@/app/actions/coordination";
import { EmptyState, Flash } from "@/components/flash";
import { areaClass, controlClass } from "@/components/field";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { addDays } from "date-fns";
import { isToday, formatDayLong, toDay } from "@/lib/dates";
import { isLinkActive } from "@/lib/links";
import { COMPETENCY_LABELS, STATE_LABELS } from "@/lib/labels";
import { canScale } from "@/lib/permissions";
import { plannedRoleLabel, scaleHints } from "@/lib/scale";
import { requireCoordinator } from "@/lib/session";

export default async function InstitutionCoordinationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  const person = await requireCoordinator();
  const { id } = await params;
  const flash = await searchParams;
  if (!canScale(person, id)) notFound();
  const since = addDays(new Date(), -14);

  const institution = await prisma.institution.findUnique({
    where: { id },
    include: {
      city: true,
      sector: true,
      links: {
        include: {
          person: { include: { availability: true, availabilityBlocks: true, competencies: true } },
        },
      },
      series: {
        include: {
          occurrences: {
            where: { date: { gte: since } },
            orderBy: { date: "asc" },
            include: {
              scale: { include: { person: true } },
              participations: true,
              justifications: { include: { person: true } },
            },
          },
        },
      },
    },
  });
  if (!institution) notFound();
  const linked = institution.links.filter((link) => isLinkActive(link) && link.person.status === "ACTIVE");
  const occurrenceIds = institution.series.flatMap((series) => series.occurrences.map((item) => item.id));
  const [conflicts, reopenRequests] = await Promise.all([
    prisma.scaleEntry.findMany({
      where: {
        personId: { in: linked.map((link) => link.personId) },
        occurrence: { cancelled: false, date: { gte: since } },
      },
      include: { occurrence: { include: { series: { include: { institution: true } } } } },
    }),
    occurrenceIds.length
      ? prisma.dualApproval.findMany({
          where: { type: "REOPEN_ATTENDANCE", entityId: { in: occurrenceIds }, status: "PENDING" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <p className="text-xs tracking-[0.18em] text-primary uppercase">Coordenação</p>
      <h1 className="mt-2 font-heading text-3xl">{institution.name}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {institution.city.name} · setor {institution.sector.code}
        {institution.capacity ? ` · até ${institution.capacity} pessoas` : ""}
        {institution.active ? "" : " · instituição inativa"}
      </p>
      <Flash erro={flash.erro} ok={flash.ok} />

      {institution.series.length === 0 ? (
        <EmptyState title="Sem série cadastrada" description="A secretaria precisa criar a recorrência deste local." />
      ) : (
        <div className="grid gap-6">
          {institution.series.flatMap((series) =>
            series.occurrences.map((occurrence) => {
              const today = isToday(occurrence.date);
              const scaledIds = new Set(occurrence.scale.map((entry) => entry.personId));
              const extras = linked.filter((link) => !scaledIds.has(link.personId));
              const dayStart = toDay(occurrence.date);
              const dayConflicts = new Map<string, string>();
              for (const entry of conflicts) {
                if (entry.occurrenceId === occurrence.id) continue;
                const sameDay = entry.occurrence.date >= dayStart && entry.occurrence.date < addDays(dayStart, 1);
                if (sameDay) dayConflicts.set(entry.personId, entry.occurrence.series.institution.name);
              }
              const hints = scaleHints(
                linked.map((link) => ({
                  personId: link.personId,
                  name: link.person.name,
                  status: link.person.status,
                  competencies: link.person.competencies.map((item) => item.competency),
                  availability: link.person.availability,
                  blocks: link.person.availabilityBlocks,
                  link: { startAt: link.startAt, endAt: link.endAt },
                })),
                occurrence.date,
                scaledIds,
                dayConflicts,
              );
              const pendingReopen = reopenRequests.find((item) => item.entityId === occurrence.id);
              const canMarkToday = today;
              return (
                <section key={occurrence.id} className="rounded-2xl border border-border p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl capitalize">{formatDayLong(occurrence.date)}</h2>
                      <p className="text-sm text-muted-foreground">
                        {series.label}
                        {occurrence.cancelled
                          ? " · cancelado"
                          : occurrence.closedAt
                            ? today
                              ? " · lista fechada · correção no mesmo dia"
                              : " · lista fechada"
                            : today
                              ? " · hoje"
                              : ""}
                      </p>
                    </div>
                  </div>

                  {occurrence.cancelled ? (
                    <p className="mt-3 text-sm text-destructive">{occurrence.cancelReason}</p>
                  ) : (
                    <>
                      <div className="mt-4 grid gap-2">
                        {occurrence.scale.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Ninguém na escala ainda.</p>
                        ) : (
                          occurrence.scale.map((entry) => {
                            const participation = occurrence.participations.find((item) => item.personId === entry.personId);
                            const justification = occurrence.justifications.find((item) => item.personId === entry.personId);
                            return (
                              <div key={entry.id} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="font-medium">{entry.person.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {plannedRoleLabel(entry.plannedRole) ? `${plannedRoleLabel(entry.plannedRole)} · ` : ""}
                                    {participation
                                      ? `${STATE_LABELS[participation.state] ?? participation.state}${participation.extra ? " · extra" : ""}`
                                      : "Ainda sem presença"}
                                    {justification ? ` · justificativa: ${justification.reason}` : ""}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {canMarkToday && (!occurrence.closedAt || today) ? (
                                    <>
                                      <form action={markParticipation}>
                                        <input type="hidden" name="occurrenceId" value={occurrence.id} />
                                        <input type="hidden" name="personId" value={entry.personId} />
                                        <input type="hidden" name="state" value="PRESENTE" />
                                        <Button type="submit" size="sm">
                                          Presente
                                        </Button>
                                      </form>
                                      <form action={markParticipation}>
                                        <input type="hidden" name="occurrenceId" value={occurrence.id} />
                                        <input type="hidden" name="personId" value={entry.personId} />
                                        <input type="hidden" name="state" value="ATRASADO" />
                                        <Button type="submit" size="sm" variant="outline">
                                          Atrasado
                                        </Button>
                                      </form>
                                      <form action={markParticipation}>
                                        <input type="hidden" name="occurrenceId" value={occurrence.id} />
                                        <input type="hidden" name="personId" value={entry.personId} />
                                        <input type="hidden" name="state" value="AUSENTE" />
                                        <Button type="submit" size="sm" variant="outline">
                                          Ausente
                                        </Button>
                                      </form>
                                    </>
                                  ) : null}
                                  {!occurrence.closedAt ? (
                                    <form action={removeScaleEntry}>
                                      <input type="hidden" name="id" value={entry.id} />
                                      <Button type="submit" size="sm" variant="outline">
                                        Tirar
                                      </Button>
                                    </form>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {!occurrence.closedAt && hints.length > 0 ? (
                        <form action={addScaleEntry} className="mt-4 grid gap-2 sm:grid-cols-[1fr_10rem_auto]">
                          <input type="hidden" name="occurrenceId" value={occurrence.id} />
                          <select className={controlClass} name="personId" required>
                            <option value="">Pessoa disponível</option>
                            {hints.map((hint) => (
                              <option key={hint.personId} value={hint.personId} disabled={!hint.eligible}>
                                {hint.label}
                              </option>
                            ))}
                          </select>
                          <select className={controlClass} name="plannedRole">
                            <option value="">Função prevista</option>
                            {Object.entries(COMPETENCY_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <Button type="submit" variant="outline">
                            Incluir na escala
                          </Button>
                        </form>
                      ) : null}

                      {today ? (
                        <div className="mt-4 grid gap-3">
                          <p className="text-sm font-medium">Participação extra</p>
                          {extras.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Todos os vinculados já estão na escala.</p>
                          ) : (
                            extras.map((link) => (
                              <form action={markParticipation} key={link.id} className="flex items-center justify-between gap-2">
                                <span className="text-sm">{link.person.name}</span>
                                <input type="hidden" name="occurrenceId" value={occurrence.id} />
                                <input type="hidden" name="personId" value={link.personId} />
                                <input type="hidden" name="extra" value="true" />
                                <Button type="submit" size="sm" variant="outline">
                                  Marcar extra
                                </Button>
                              </form>
                            ))
                          )}
                          <form action={closeOccurrence}>
                            <input type="hidden" name="id" value={occurrence.id} />
                            <Button type="submit">{occurrence.closedAt ? "Atualizar lista de hoje" : "Fechar lista de hoje"}</Button>
                          </form>
                        </div>
                      ) : null}

                      {!today && occurrence.closedAt ? (
                        pendingReopen ? (
                          <p className="mt-4 text-sm text-muted-foreground">
                            Pedido de reabertura enviado à secretaria. Aguarda dupla aprovação.
                          </p>
                        ) : (
                          <form action={requestReopenAttendance} className="mt-4 grid gap-2">
                            <input type="hidden" name="id" value={occurrence.id} />
                            <textarea className={areaClass} name="reason" placeholder="Por que reabrir a lista depois do dia?" required />
                            <Button type="submit" variant="outline">
                              Pedir reabertura (dupla aprovação)
                            </Button>
                          </form>
                        )
                      ) : null}

                      <form action={addOccurrenceNote} className="mt-4 grid gap-2">
                        <input type="hidden" name="id" value={occurrence.id} />
                        <textarea
                          className={areaClass}
                          name="notes"
                          defaultValue={occurrence.notes ?? ""}
                          placeholder="Observação do atendimento."
                        />
                        <Button type="submit" variant="outline">
                          Salvar observação
                        </Button>
                      </form>
                      <form action={attachOccurrencePhoto} encType="multipart/form-data" className="mt-4 grid gap-2">
                        <input type="hidden" name="id" value={occurrence.id} />
                        <p className="text-sm font-medium">Foto ou PDF do atendimento</p>
                        {occurrence.photoUrl ? (
                          <p className="text-sm text-muted-foreground">
                            {occurrence.photoApproved
                              ? "Arquivo aprovado pela secretaria."
                              : "Aguardando moderação da secretaria."}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Só fica visível no sistema depois da moderação. JPEG, PNG, WebP, PDF, DOCX ou planilha.
                          </p>
                        )}
                        {occurrence.photoApproved && occurrence.photoUrl ? (
                          <a className="text-sm underline-offset-4 hover:underline" href={occurrence.photoUrl}>
                            Abrir arquivo aprovado
                          </a>
                        ) : null}
                        <input className="text-sm" type="file" name="photo" accept="image/jpeg,image/png,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" />
                        <Button type="submit" variant="outline">
                          Enviar para moderação
                        </Button>
                      </form>

                      {!occurrence.closedAt ? (
                        <form action={cancelOccurrence} className="mt-4 grid gap-2">
                          <input type="hidden" name="id" value={occurrence.id} />
                          <textarea className={areaClass} name="reason" placeholder="Justificativa do cancelamento" required />
                          <Button type="submit" variant="destructive">
                            Cancelar atendimento
                          </Button>
                        </form>
                      ) : null}
                    </>
                  )}
                </section>
              );
            }),
          )}
        </div>
      )}
    </div>
  );
}
