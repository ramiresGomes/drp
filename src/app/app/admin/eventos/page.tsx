import {
  addBaptismName,
  createEventType,
  createRegionalEvent,
  markEventAttendance,
  toggleChecklistItem,
  updateChecklistDetails,
} from "@/app/actions/admin";
import { AdminNav } from "@/components/admin-nav";
import { EmptyState, Flash } from "@/components/flash";
import { controlClass, Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseChecklist } from "@/lib/checklist";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/dates";
import { requireAdmin } from "@/lib/session";
import Link from "next/link";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const [types, events, people] = await Promise.all([
    prisma.eventType.findMany({ orderBy: { name: "asc" } }),
    prisma.regionalEvent.findMany({
      include: { type: true, baptisms: true, attendances: true },
      orderBy: { startsAt: "desc" },
    }),
    prisma.person.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <AdminNav current="/app/admin/eventos" />
      <h1 className="mb-2 font-heading text-3xl">Eventos regionais</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Evento obrigatório vale para toda a regional. Não obrigatório vale para quem está escalado. QR cobre o evento
        inteiro; a secretaria também lança presença manual. Batismo registra só os nomes e o ancião que preside.
      </p>
      <Flash erro={params.erro} ok={params.ok} />

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Tipo de evento</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createEventType} className="grid gap-3">
              <Field label="Nome">
                <input className={controlClass} name="name" required />
              </Field>
              <Field label="Checklist (um item por linha)">
                <textarea className="min-h-24 w-full rounded-lg border border-input px-2.5 py-2 text-sm" name="checklist" />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="mandatory" /> Tipo obrigatório por padrão
              </label>
              <Button type="submit">Salvar tipo</Button>
            </form>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Novo evento</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createRegionalEvent} className="grid gap-3">
              <Field label="Título">
                <input className={controlClass} name="title" required />
              </Field>
              <Field label="Tipo">
                <select className={controlClass} name="typeId" required>
                  {types.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Início">
                <input className={controlClass} type="datetime-local" name="startsAt" required />
              </Field>
              <Field label="Local">
                <input className={controlClass} name="location" required />
              </Field>
              <Field label="Ancião que preside (batismo)">
                <input className={controlClass} name="presidingElder" />
              </Field>
              <Field label="Latitude (opcional)">
                <input className={controlClass} name="latitude" placeholder="-18.9186" />
              </Field>
              <Field label="Longitude (opcional)">
                <input className={controlClass} name="longitude" placeholder="-48.2772" />
              </Field>
              <Field label="Raio do check-in (metros)">
                <input className={controlClass} type="number" name="radiusMeters" defaultValue={250} min={50} />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="mandatory" /> Obrigatório para toda a regional
              </label>
              <Button type="submit">Publicar evento</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {events.length === 0 ? (
        <EmptyState title="Nenhum evento" description="Publique reunião, ensaio ou batismo." />
      ) : (
        <div className="grid gap-4">
          {events.map((event) => {
            const checklist = parseChecklist(event.checklistJson);
            return (
            <div key={event.id} className="rounded-xl border border-border p-4">
              <p className="font-medium">{event.title}</p>
              <p className="text-sm text-muted-foreground">
                {event.type.name} · {formatDateTime(event.startsAt)} · {event.location}
                {event.mandatory ? " · obrigatório" : ""}
                {event.cancelled ? " · cancelado" : ""}
                {event.presidingElder ? ` · preside ${event.presidingElder}` : ""}
                {event.latitude != null && event.longitude != null ? " · check-in com geofence" : ""}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {event.attendances.length} presença(s)
              </p>
              <p className="mt-1 text-sm">
                <Link className="underline-offset-4 hover:underline" href={`/app/checkin/${event.checkinToken}`}>
                  Abrir página do QR / check-in
                </Link>
              </p>
              {checklist.length > 0 ? (
                <div className="mt-3 grid gap-3">
                  <p className="text-sm font-medium">Checklist deste evento</p>
                  {checklist.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border p-3">
                      <form action={toggleChecklistItem} className="flex items-center justify-between gap-2">
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="itemId" value={item.id} />
                        <span className="text-sm">
                          {item.done ? "✓ " : ""}
                          {item.label}
                          {item.required ? " · obrigatório" : ""}
                          {item.owner ? ` · resp. ${item.owner}` : ""}
                          {item.dueAt ? ` · até ${item.dueAt.replace("T", " ")}` : ""}
                        </span>
                        <Button type="submit" size="sm" variant="outline">
                          {item.done ? "Reabrir item" : "Concluir"}
                        </Button>
                      </form>
                      <form action={updateChecklistDetails} className="mt-2 grid gap-2 sm:grid-cols-3">
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="itemId" value={item.id} />
                        <Field label="Responsável">
                          <input className={controlClass} name="owner" defaultValue={item.owner} />
                        </Field>
                        <Field label="Prazo">
                          <input className={controlClass} type="datetime-local" name="dueAt" defaultValue={item.dueAt} />
                        </Field>
                        <Field label="Evidência">
                          <input className={controlClass} name="evidence" defaultValue={item.evidence} placeholder="Link ou nota" />
                        </Field>
                        <Button type="submit" size="sm" variant="outline" className="sm:col-span-3">
                          Guardar responsável e prazo
                        </Button>
                      </form>
                    </div>
                  ))}
                </div>
              ) : null}
              {event.type.name.toLowerCase().includes("batismo") || event.baptisms.length > 0 ? (
                <div className="mt-3">
                  <p className="text-sm font-medium">Batizandos</p>
                  <ul className="mt-1 text-sm text-muted-foreground">
                    {event.baptisms.length === 0 ? <li>Nenhum nome lançado.</li> : event.baptisms.map((item) => <li key={item.id}>{item.fullName}</li>)}
                  </ul>
                  <form action={addBaptismName} className="mt-2 flex gap-2">
                    <input type="hidden" name="eventId" value={event.id} />
                    <input type="hidden" name="from" value="/app/admin/eventos" />
                    <input className={controlClass} name="fullName" placeholder="Nome completo" required />
                    <Button type="submit" variant="outline">
                      Incluir nome
                    </Button>
                  </form>
                </div>
              ) : null}
              <form action={markEventAttendance} className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input type="hidden" name="eventId" value={event.id} />
                <select className={controlClass} name="personId" required>
                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
                <Button type="submit" variant="outline">
                  Lançar presença manual
                </Button>
              </form>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
