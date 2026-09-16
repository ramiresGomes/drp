import { addDays } from "date-fns";
import { toDay } from "@/lib/dates";
import { isLinkActive } from "@/lib/links";
import { COMPETENCY_LABELS } from "@/lib/labels";

export type LinkedCandidate = {
  personId: string;
  name: string;
  status: string;
  competencies: string[];
  availability: Array<{ weekday: number; available: boolean }>;
  blocks: Array<{ startAt: Date; endAt: Date }>;
  link: { startAt: Date; endAt: Date | null };
};

export type ScaleHint = {
  personId: string;
  name: string;
  label: string;
  eligible: boolean;
  reason: string | null;
};

export function plannedRoleLabel(value: string | null | undefined) {
  if (!value) return null;
  return COMPETENCY_LABELS[value] ?? value;
}

export function scaleHints(
  candidates: LinkedCandidate[],
  occurrenceDate: Date,
  alreadyScaledIds: Set<string>,
  conflicts: Map<string, string>,
) {
  const weekday = occurrenceDate.getDay();
  const dayStart = toDay(occurrenceDate);
  const hints: ScaleHint[] = [];

  for (const candidate of candidates) {
    if (alreadyScaledIds.has(candidate.personId)) continue;
    const availability = candidate.availability.find((item) => item.weekday === weekday);
    const blocked = candidate.blocks.some((block) => block.startAt <= occurrenceDate && block.endAt >= dayStart);
    const conflict = conflicts.get(candidate.personId);
    let reason: string | null = null;
    if (candidate.status !== "ACTIVE") reason = "Cadastro inativo";
    else if (!isLinkActive(candidate.link)) reason = "Vínculo inativo";
    else if (availability && !availability.available) reason = "Indisponível neste dia da semana";
    else if (blocked) reason = "Bloqueio de agenda";
    else if (conflict) reason = `Conflito: já escalado em ${conflict}`;
    hints.push({
      personId: candidate.personId,
      name: candidate.name,
      label: reason ? `${candidate.name} · ${reason}` : `${candidate.name} · disponível`,
      eligible: !reason,
      reason,
    });
  }

  return hints.sort((a, b) => Number(b.eligible) - Number(a.eligible) || a.name.localeCompare(b.name, "pt-BR"));
}

export function conflictDayFilter(occurrenceDate: Date, occurrenceId: string) {
  const dayStart = toDay(occurrenceDate);
  return {
    occurrenceId: { not: occurrenceId },
    occurrence: {
      cancelled: false,
      date: { gte: dayStart, lt: addDays(dayStart, 1) },
    },
  };
}
