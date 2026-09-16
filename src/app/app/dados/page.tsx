import {
  addAvailabilityBlock,
  deleteAvailabilityBlock,
  saveAvailability,
  submitLgpdRequest,
  updateNotificationPreference,
  updateOwnProfile,
} from "@/app/actions/member";
import { Flash } from "@/components/flash";
import { areaClass, controlClass, Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { formatDateTime, formatDay } from "@/lib/dates";
import { COMPETENCY_LABELS, LGPD_STATUS_LABELS, LGPD_TYPE_LABELS, ROLE_LABELS, STATE_LABELS, WEEKDAYS } from "@/lib/labels";
import { requirePerson } from "@/lib/session";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  const current = await requirePerson();
  const params = await searchParams;
  const person = await prisma.person.findUniqueOrThrow({
    where: { id: current.id },
    include: {
      congregation: { include: { city: true } },
      roles: true,
      competencies: true,
      links: { include: { institution: true } },
      availability: true,
      availabilityBlocks: { orderBy: { startAt: "desc" } },
      lgpdRequests: { orderBy: { createdAt: "desc" } },
      scaleEntries: {
        where: { occurrence: { date: { lt: new Date() } } },
        include: { occurrence: { include: { series: { include: { institution: true } } } } },
        orderBy: { occurrence: { date: "desc" } },
        take: 8,
      },
      participations: {
        include: { occurrence: { include: { series: { include: { institution: true } } } } },
        orderBy: { recordedAt: "desc" },
        take: 8,
      },
      eventAttendances: {
        include: { event: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      },
    },
  });

  return (
    <div>
      <h1 className="mb-2 font-heading text-3xl">Meus dados</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Papéis, competências e comum de congregação são da secretaria. Telefone, observação, bloqueios, preferência de
        aviso e pedido LGPD você atualiza aqui.
      </p>
      <Flash erro={params.erro} ok={params.ok} />

      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Cadastro Darpe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>{person.name}</p>
            <p>{person.email}</p>
            <p>
              {person.congregation.name} · {person.congregation.city.name}
            </p>
            <p>{person.roles.map((item) => ROLE_LABELS[item.role] ?? item.role).join(", ") || "Sem papel"}</p>
            <p>
              {person.competencies.map((item) => COMPETENCY_LABELS[item.competency] ?? item.competency).join(", ") ||
                "Sem competência"}
            </p>
            <p>
              Vínculos:{" "}
              {person.links.map((link) => link.institution.name).join(", ") || "nenhum vínculo institucional"}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Contato</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateOwnProfile} className="grid gap-3">
              <Field label="Telefone">
                <input className={controlClass} name="phone" defaultValue={person.phone} required />
              </Field>
              <Field label="Observação">
                <textarea className={areaClass} name="notes" defaultValue={person.notes ?? ""} />
              </Field>
              <Button type="submit">Salvar</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Avisos opcionais</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Aviso obrigatório continua chegando. Esta preferência só silencia comunicado informativo.
          </p>
          <form action={updateNotificationPreference} className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="muteOptional" defaultChecked={person.muteOptionalNotifications} />
              Não receber avisos opcionais
            </label>
            <Button type="submit" variant="outline">
              Guardar preferência
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-6 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Disponibilidade semanal</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {WEEKDAYS.map((day) => {
            const currentDay = person.availability.find((item) => item.weekday === Number(day.value));
            return (
              <form action={saveAvailability} key={day.value} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[8rem_auto_6rem] sm:items-end">
                <input type="hidden" name="weekday" value={day.value} />
                <p className="text-sm font-medium">{day.label}</p>
                <Field label="Nota">
                  <input className={controlClass} name="note" defaultValue={currentDay?.note ?? ""} />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="available" defaultChecked={currentDay?.available ?? true} />
                  Disponível
                </label>
                <Button type="submit" variant="outline" className="sm:col-span-3">
                  Atualizar {day.label.toLowerCase()}
                </Button>
              </form>
            );
          })}
        </CardContent>
      </Card>

      <Card className="mb-6 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Bloqueios de agenda</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            Um bloqueio impede a escala no período. Não substitui a indisponibilidade semanal.
          </p>
          <form action={addAvailabilityBlock} className="grid gap-3 md:grid-cols-4">
            <Field label="Início">
              <input className={controlClass} type="datetime-local" name="startAt" required />
            </Field>
            <Field label="Fim">
              <input className={controlClass} type="datetime-local" name="endAt" required />
            </Field>
            <Field label="Motivo (opcional)">
              <input className={controlClass} name="note" />
            </Field>
            <div className="flex items-end">
              <Button type="submit">Registrar bloqueio</Button>
            </div>
          </form>
          {person.availabilityBlocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum bloqueio registrado.</p>
          ) : (
            person.availabilityBlocks.map((block) => (
              <div key={block.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                <p className="text-sm">
                  {formatDateTime(block.startAt)} — {formatDateTime(block.endAt)}
                  {block.note ? ` · ${block.note}` : ""}
                </p>
                <form action={deleteAvailabilityBlock}>
                  <input type="hidden" name="id" value={block.id} />
                  <Button type="submit" size="sm" variant="ghost">
                    Remover
                  </Button>
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Pedido LGPD</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            Acesso e correção a secretaria atende. Exclusão definitiva segue para dupla aprovação.
          </p>
          <form action={submitLgpdRequest} className="grid gap-3 md:grid-cols-2">
            <Field label="Tipo">
              <select className={controlClass} name="type" required>
                {Object.entries(LGPD_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Justificativa" className="md:col-span-2">
              <textarea className={areaClass} name="reason" required />
            </Field>
            <Button type="submit">Enviar pedido</Button>
          </form>
          {person.lgpdRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pedido enviado.</p>
          ) : (
            person.lgpdRequests.map((item) => (
              <div key={item.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                <p className="font-medium">
                  {LGPD_TYPE_LABELS[item.type] ?? item.type} · {LGPD_STATUS_LABELS[item.status] ?? item.status}
                </p>
                <p className="text-muted-foreground">
                  {formatDateTime(item.createdAt)} · {item.reason}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Meu histórico</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          <div>
            <p className="font-medium">Escalas anteriores</p>
            {person.scaleEntries.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma escala passada.</p>
            ) : (
              person.scaleEntries.map((entry) => (
                <p key={entry.id} className="text-muted-foreground">
                  {entry.occurrence.series.institution.name} · {formatDay(entry.occurrence.date)}
                </p>
              ))
            )}
          </div>
          <div>
            <p className="font-medium">Presenças em atendimento</p>
            {person.participations.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma presença lançada.</p>
            ) : (
              person.participations.map((item) => (
                <p key={item.id} className="text-muted-foreground">
                  {item.occurrence.series.institution.name} · {formatDay(item.occurrence.date)} ·{" "}
                  {STATE_LABELS[item.state] ?? item.state}
                  {item.extra ? " · extra" : ""}
                </p>
              ))
            )}
          </div>
          <div>
            <p className="font-medium">Presenças em evento</p>
            {person.eventAttendances.length === 0 ? (
              <p className="text-muted-foreground">Nenhum check-in de evento.</p>
            ) : (
              person.eventAttendances.map((item) => (
                <p key={item.id} className="text-muted-foreground">
                  {item.event.title} · {formatDateTime(item.createdAt)}
                </p>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
