import { icsCalendar } from "@/lib/ics";
import { addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { getCurrentPerson } from "@/lib/session";

export async function GET() {
  const person = await getCurrentPerson();
  if (!person) {
    return new Response("Faça login para exportar a agenda.", { status: 401 });
  }

  const now = new Date();
  const [scale, events, links] = await Promise.all([
    prisma.scaleEntry.findMany({
      where: { personId: person.id, occurrence: { date: { gte: now }, cancelled: false } },
      include: { occurrence: { include: { series: { include: { institution: true } } } } },
    }),
    prisma.regionalEvent.findMany({
      where: { startsAt: { gte: now }, cancelled: false },
      include: { type: true },
    }),
    prisma.institutionLink.findMany({ where: { personId: person.id } }),
  ]);

  const visibleEvents = events.filter(
    (event) =>
      event.mandatory ||
      event.audience === "todos" ||
      (event.audience === "musicos" && person.competencies.includes("MUSICO")) ||
      scale.length > 0 ||
      links.length > 0 ||
      isAdmin(person),
  );

  const body = icsCalendar([
    ...scale.map((entry) => ({
      uid: `scale-${entry.id}@darpe.local`,
      title: `Atendimento · ${entry.occurrence.series.institution.name}`,
      start: entry.occurrence.date,
      end: addDays(entry.occurrence.date, 1),
      allDay: true,
      location: entry.occurrence.series.institution.name,
      description: entry.plannedRole ? `Função prevista: ${entry.plannedRole}` : "Escala Darpe",
    })),
    ...visibleEvents.map((event) => ({
      uid: `event-${event.id}@darpe.local`,
      title: event.title,
      start: event.startsAt,
      end: event.endsAt,
      location: event.location,
      description: event.mandatory ? "Evento obrigatório da regional" : event.type.name,
    })),
  ]);

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="agenda-darpe.ics"',
    },
  });
}
