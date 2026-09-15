"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { isToday } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { fail, field } from "@/lib/forms";
import { canScale } from "@/lib/permissions";
import { requireCoordinator } from "@/lib/session";

async function requireInstitutionAccess(institutionId: string) {
  const person = await requireCoordinator();
  if (!canScale(person, institutionId)) {
    fail("/app/coordenacao", "Sem permissão para coordenar esta instituição.");
  }
  return person;
}

export async function addScaleEntry(formData: FormData) {
  const occurrenceId = field(formData, "occurrenceId");
  const personId = field(formData, "personId");
  const occurrence = await prisma.occurrence.findUnique({
    where: { id: occurrenceId },
    include: { series: true },
  });
  if (!occurrence) fail("/app/coordenacao", "Atendimento não encontrado.");
  const actor = await requireInstitutionAccess(occurrence.series.institutionId);

  const link = await prisma.institutionLink.findUnique({
    where: {
      institutionId_personId: {
        institutionId: occurrence.series.institutionId,
        personId,
      },
    },
  });
  if (!link || (link.endAt && link.endAt <= new Date())) {
    fail(`/app/coordenacao/${occurrence.series.institutionId}`, "Só entra na escala quem tem vínculo ativo.");
  }

  await prisma.scaleEntry.upsert({
    where: { occurrenceId_personId: { occurrenceId, personId } },
    update: {},
    create: { occurrenceId, personId },
  });
  await audit(actor.id, "SCALE_ADD", "Occurrence", occurrenceId, "Pessoa incluída na escala");
  revalidatePath(`/app/coordenacao/${occurrence.series.institutionId}`);
}

export async function removeScaleEntry(formData: FormData) {
  const id = field(formData, "id");
  const entry = await prisma.scaleEntry.findUnique({
    where: { id },
    include: { occurrence: { include: { series: true } } },
  });
  if (!entry) return;
  const actor = await requireInstitutionAccess(entry.occurrence.series.institutionId);
  await prisma.scaleEntry.delete({ where: { id } });
  await audit(actor.id, "SCALE_REMOVE", "Occurrence", entry.occurrenceId, "Pessoa retirada da escala");
  revalidatePath(`/app/coordenacao/${entry.occurrence.series.institutionId}`);
}

export async function cancelOccurrence(formData: FormData) {
  const id = field(formData, "id");
  const reason = field(formData, "reason");
  if (!reason) fail("/app/coordenacao", "Cancelamento exige justificativa.");
  const occurrence = await prisma.occurrence.findUnique({
    where: { id },
    include: { series: true },
  });
  if (!occurrence) fail("/app/coordenacao", "Atendimento não encontrado.");
  const actor = await requireInstitutionAccess(occurrence.series.institutionId);
  await prisma.occurrence.update({
    where: { id },
    data: { cancelled: true, cancelReason: reason, cancelledById: actor.id },
  });
  await audit(actor.id, "CANCEL_OCCURRENCE", "Occurrence", id, reason);
  revalidatePath(`/app/coordenacao/${occurrence.series.institutionId}`);
}

export async function markParticipation(formData: FormData) {
  const occurrenceId = field(formData, "occurrenceId");
  const personId = field(formData, "personId");
  const extra = field(formData, "extra") === "on" || field(formData, "extra") === "true";
  const occurrence = await prisma.occurrence.findUnique({
    where: { id: occurrenceId },
    include: { series: true },
  });
  if (!occurrence) fail("/app/coordenacao", "Atendimento não encontrado.");
  const actor = await requireInstitutionAccess(occurrence.series.institutionId);
  if (!isToday(occurrence.date)) {
    fail(`/app/coordenacao/${occurrence.series.institutionId}`, "Presença só pode ser lançada no mesmo dia do atendimento.");
  }
  if (occurrence.closedAt) {
    fail(`/app/coordenacao/${occurrence.series.institutionId}`, "A lista deste atendimento já foi fechada.");
  }

  await prisma.participation.upsert({
    where: { occurrenceId_personId: { occurrenceId, personId } },
    update: { state: extra ? "PRESENTE" : "PRESENTE", extra, recordedAt: new Date() },
    create: {
      occurrenceId,
      personId,
      state: "PRESENTE",
      extra,
    },
  });
  revalidatePath(`/app/coordenacao/${occurrence.series.institutionId}`);
}

export async function closeOccurrence(formData: FormData) {
  const id = field(formData, "id");
  const occurrence = await prisma.occurrence.findUnique({
    where: { id },
    include: { series: true, scale: true, participations: true, justifications: true },
  });
  if (!occurrence) fail("/app/coordenacao", "Atendimento não encontrado.");
  const actor = await requireInstitutionAccess(occurrence.series.institutionId);
  if (!isToday(occurrence.date)) {
    fail(`/app/coordenacao/${occurrence.series.institutionId}`, "O fechamento da lista é no mesmo dia.");
  }

  for (const entry of occurrence.scale) {
    const already = occurrence.participations.find((item) => item.personId === entry.personId);
    if (already) continue;
    const justified = occurrence.justifications.find((item) => item.personId === entry.personId);
    await prisma.participation.create({
      data: {
        occurrenceId: id,
        personId: entry.personId,
        state: justified ? "JUSTIFICADO" : "AUSENTE",
      },
    });
  }

  await prisma.occurrence.update({ where: { id }, data: { closedAt: new Date() } });
  await audit(actor.id, "CLOSE_OCCURRENCE", "Occurrence", id, "Lista de presença fechada");
  revalidatePath(`/app/coordenacao/${occurrence.series.institutionId}`);
}

export async function addOccurrenceNote(formData: FormData) {
  const id = field(formData, "id");
  const notes = field(formData, "notes");
  const occurrence = await prisma.occurrence.findUnique({
    where: { id },
    include: { series: true },
  });
  if (!occurrence) fail("/app/coordenacao", "Atendimento não encontrado.");
  const actor = await requireInstitutionAccess(occurrence.series.institutionId);
  await prisma.occurrence.update({ where: { id }, data: { notes } });
  await audit(actor.id, "OCCURRENCE_NOTE", "Occurrence", id, "Observação do atendimento");
  revalidatePath(`/app/coordenacao/${occurrence.series.institutionId}`);
}
