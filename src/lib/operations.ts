import { addDays } from "date-fns";
import { pendingRequired, parseChecklist } from "@/lib/checklist";
import { prisma } from "@/lib/db";
import { isLinkActive } from "@/lib/links";
import { parsePeriod, periodRange, type PeriodKey } from "@/lib/period";

export async function getOperationalPendencies() {
  const now = new Date();
  const inTenDays = addDays(now, 10);
  const inThirtyDays = addDays(now, 30);

  const [emptyScales, expiringLinks, upcomingEvents, pendingPhotos, expiringDocuments, pendingLgpd, openIncidents, nearCapacity] =
    await Promise.all([
      prisma.occurrence.findMany({
        where: {
          cancelled: false,
          closedAt: null,
          date: { gte: now, lte: inTenDays },
          scale: { none: {} },
        },
        include: { series: { include: { institution: true } } },
        orderBy: { date: "asc" },
        take: 8,
      }),
      prisma.institutionLink.findMany({
        where: {
          endAt: { not: null, gte: now, lte: inThirtyDays },
        },
        include: { person: true, institution: true },
        orderBy: { endAt: "asc" },
        take: 8,
      }),
      prisma.regionalEvent.findMany({
        where: { cancelled: false, startsAt: { gte: now } },
        orderBy: { startsAt: "asc" },
        take: 12,
      }),
      prisma.occurrence.findMany({
        where: { photoUrl: { not: null }, photoApproved: false, cancelled: false },
        include: { series: { include: { institution: true } } },
        orderBy: { date: "desc" },
        take: 8,
      }),
      prisma.person.findMany({
        where: { status: "ACTIVE", documentExpiresAt: { not: null, gte: now, lte: inThirtyDays } },
        orderBy: { documentExpiresAt: "asc" },
        take: 8,
      }),
      prisma.lgpdRequest.count({ where: { status: "PENDING" } }),
      prisma.incident.count({ where: { status: "OPEN" } }),
      prisma.occurrence.findMany({
        where: {
          cancelled: false,
          date: { gte: now, lte: inTenDays },
          series: { institution: { active: true, capacity: { not: null } } },
        },
        include: {
          scale: true,
          series: { include: { institution: true } },
        },
        orderBy: { date: "asc" },
        take: 40,
      }),
    ]);

  const delayedChecklists = upcomingEvents
    .map((event) => ({
      event,
      pending: pendingRequired(parseChecklist(event.checklistJson)),
    }))
    .filter((item) => item.pending.length > 0)
    .slice(0, 8);

  const capacityAlerts = nearCapacity
    .filter((item) => {
      const capacity = item.series.institution.capacity;
      return Boolean(capacity && item.scale.length >= Math.ceil(capacity * 0.8));
    })
    .slice(0, 8);

  return {
    emptyScales,
    expiringLinks: expiringLinks.filter(isLinkActive),
    delayedChecklists,
    pendingPhotos,
    expiringDocuments,
    pendingLgpd,
    openIncidents,
    capacityAlerts,
  };
}

export async function getDashboardMetrics(period: PeriodKey) {
  const range = periodRange(period);
  const occurrences = await prisma.occurrence.findMany({
    where: { date: { gte: range.start, lte: range.end } },
    include: { series: { include: { institution: true } }, participations: true, scale: true },
  });
  const [newPeople, newInstitutions, lastMeeting, lastRehearsal] = await Promise.all([
    prisma.person.count({
      where: { createdAt: { gte: range.start, lte: range.end }, status: { not: "ERASED" } },
    }),
    prisma.institution.count({
      where: { createdAt: { gte: range.start, lte: range.end } },
    }),
    prisma.regionalEvent.findFirst({
      where: {
        cancelled: false,
        mandatory: true,
        startsAt: { lte: new Date() },
        type: { name: { contains: "Reunião" } },
      },
      include: { attendances: true, justifications: true },
      orderBy: { startsAt: "desc" },
    }),
    prisma.regionalEvent.findFirst({
      where: {
        cancelled: false,
        mandatory: true,
        startsAt: { lte: new Date() },
        type: { name: { contains: "Ensaio" } },
      },
      include: { attendances: true, justifications: true },
      orderBy: { startsAt: "desc" },
    }),
  ]);

  const previstos = occurrences.filter((item) => !item.cancelled && !item.closedAt).length;
  const realizados = occurrences.filter((item) => item.closedAt).length;
  const cancelados = occurrences.filter((item) => item.cancelled).length;
  const presentes = occurrences.flatMap((item) => item.participations).filter((item) => item.state === "PRESENTE" && !item.extra).length;
  const extras = occurrences.flatMap((item) => item.participations).filter((item) => item.state === "PRESENTE" && item.extra).length;
  const atrasados = occurrences.flatMap((item) => item.participations).filter((item) => item.state === "ATRASADO").length;
  const ausentes = occurrences.flatMap((item) => item.participations).filter((item) => item.state === "AUSENTE").length;
  const justificadas = occurrences.flatMap((item) => item.participations).filter((item) => item.state === "JUSTIFICADO").length;
  const scaledClosed = occurrences.filter((item) => item.closedAt).reduce((sum, item) => sum + item.scale.length, 0);
  const presentOrLate = presentes + atrasados;
  const presenceRate = scaledClosed === 0 ? null : Math.round((presentOrLate / scaledClosed) * 100);
  const closedStates = presentes + extras + atrasados + ausentes + justificadas;
  const justificationRate = closedStates === 0 ? 0 : justificadas / closedStates;
  const highJustifications = closedStates >= 4 && justificationRate >= 0.25;

  function eventStats(event: { title: string; attendances: unknown[]; justifications: unknown[] } | null) {
    if (!event) return null;
    return {
      title: event.title,
      presentes: event.attendances.length,
      justificados: event.justifications.length,
    };
  }

  return {
    range,
    previstos,
    realizados,
    cancelados,
    presentes,
    extras,
    atrasados,
    ausentes,
    justificadas,
    presenceRate,
    highJustifications,
    newPeople,
    newInstitutions,
    lastMeeting: eventStats(lastMeeting),
    lastRehearsal: eventStats(lastRehearsal),
  };
}

export function parseDashboardPeriod(value: string | null | undefined) {
  return parsePeriod(value);
}
