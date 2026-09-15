import { addDays } from "date-fns";
import { pendingRequired, parseChecklist } from "@/lib/checklist";
import { prisma } from "@/lib/db";
import { isLinkActive } from "@/lib/links";

export async function getOperationalPendencies() {
  const now = new Date();
  const inTenDays = addDays(now, 10);
  const inThirtyDays = addDays(now, 30);

  const [emptyScales, expiringLinks, upcomingEvents] = await Promise.all([
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
  ]);

  const delayedChecklists = upcomingEvents
    .map((event) => ({
      event,
      pending: pendingRequired(parseChecklist(event.checklistJson)),
    }))
    .filter((item) => item.pending.length > 0)
    .slice(0, 8);

  return {
    emptyScales,
    expiringLinks: expiringLinks.filter(isLinkActive),
    delayedChecklists,
  };
}
