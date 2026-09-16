import { addMonths, endOfMonth, endOfQuarter, endOfYear, startOfMonth, startOfQuarter, startOfYear } from "date-fns";

export const PERIOD_KEYS = ["mes", "trimestre", "semestre", "ano"] as const;
export type PeriodKey = (typeof PERIOD_KEYS)[number];

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  mes: "Mês",
  trimestre: "Trimestre",
  semestre: "Semestre",
  ano: "Ano",
};

export function parsePeriod(value: string | null | undefined): PeriodKey {
  return PERIOD_KEYS.includes(value as PeriodKey) ? (value as PeriodKey) : "mes";
}

export function periodRange(key: PeriodKey, now = new Date()) {
  if (key === "trimestre") {
    return { start: startOfQuarter(now), end: endOfQuarter(now), key };
  }
  if (key === "ano") {
    return { start: startOfYear(now), end: endOfYear(now), key };
  }
  if (key === "semestre") {
    const yearStart = startOfYear(now);
    const start = now.getMonth() < 6 ? yearStart : addMonths(yearStart, 6);
    return { start, end: endOfMonth(addMonths(start, 5)), key };
  }
  return { start: startOfMonth(now), end: endOfMonth(now), key };
}
