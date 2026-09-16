import { addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { generateDates } from "@/lib/dates";

export async function ensureOccurrences(seriesId?: string) {
  const until = addDays(new Date(), 70);
  const seriesList = await prisma.recurringSeries.findMany({
    where: {
      active: true,
      institution: { active: true },
      ...(seriesId ? { id: seriesId } : {}),
    },
  });

  for (const series of seriesList) {
    const dates = generateDates(series.startDate, series.intervalDays, until);
    for (const date of dates) {
      await prisma.occurrence.upsert({
        where: { seriesId_date: { seriesId: series.id, date } },
        update: {},
        create: { seriesId: series.id, date },
      });
    }
  }
}
