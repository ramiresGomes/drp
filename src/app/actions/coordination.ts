"use server";

import { addDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { isToday, toDay } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { fail, field, ok } from "@/lib/forms";
import { notifyPeople } from "@/lib/notifications";
import { canScale } from "@/lib/permissions";
import { requireCoordinator } from "@/lib/session";
import { saveUpload } from "@/lib/uploads";

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
  const path = `/app/coordenacao/${occurrence.series.institutionId}`;

  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: { availability: true },
  });
  if (!person || person.status !== "ACTIVE") {
    fail(path, "Só entra na escala quem está com cadastro ativo.");
  }

  const institution = await prisma.institution.findUnique({ where: { id: occurrence.series.institutionId } });
  if (!institution?.active) {
    fail(path, "Esta instituição está inativa.");
  }

  const link = await prisma.institutionLink.findUnique({
    where: {
      institutionId_personId: {
        institutionId: occurrence.series.institutionId,
        personId,
      },
    },
  });
  if (!link || (link.endAt && link.endAt <= new Date()) || link.startAt > new Date()) {
    fail(path, "Só entra na escala quem tem vínculo ativo.");
  }

  const weekday = occurrence.date.getDay();
  const availability = person.availability.find((item) => item.weekday === weekday);
  if (availability && !availability.available) {
    fail(path, "Esta pessoa marcou indisponibilidade neste dia da semana.");
  }
  const blocked = await prisma.availabilityBlock.findFirst({
    where: {
      personId,
      startAt: { lte: occurrence.date },
      endAt: { gte: toDay(occurrence.date) },
    },
  });
  if (blocked) {
    fail(path, "Esta pessoa tem bloqueio de agenda neste período.");
  }

  const currentCount = await prisma.scaleEntry.count({ where: { occurrenceId } });
  if (institution.capacity && currentCount >= institution.capacity) {
    fail(path, `Capacidade máxima de ${institution.capacity} pessoas neste atendimento.`);
  }

  const plannedRole = field(formData, "plannedRole") || null;
  const dayStart = toDay(occurrence.date);
  const conflict = await prisma.scaleEntry.findFirst({
    where: {
      personId,
      occurrenceId: { not: occurrenceId },
      occurrence: {
        cancelled: false,
        date: { gte: dayStart, lt: addDays(dayStart, 1) },
      },
    },
    include: { occurrence: { include: { series: { include: { institution: true } } } } },
  });
  if (conflict) {
    fail(path, `Conflito de horário: já escalado em ${conflict.occurrence.series.institution.name} neste dia.`);
  }

  await prisma.scaleEntry.upsert({
    where: { occurrenceId_personId: { occurrenceId, personId } },
    update: { plannedRole },
    create: { occurrenceId, personId, plannedRole },
  });
  await audit(actor.id, "SCALE_ADD", "Occurrence", occurrenceId, plannedRole ? `Pessoa incluída na escala · ${plannedRole}` : "Pessoa incluída na escala");
  await notifyPeople({
    title: `Você foi escalado em ${institution.name}`,
    body: `A coordenação incluiu você na escala de ${institution.name} em ${occurrence.date.toLocaleDateString("pt-BR")}. Não é preciso confirmar.`,
    personIds: [personId],
    kind: "OPS",
  });
  revalidatePath(`/app/coordenacao/${occurrence.series.institutionId}`);
  revalidatePath("/app/agenda");
  revalidatePath("/app/notificacoes");
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
    include: { series: { include: { institution: true } }, scale: true },
  });
  if (!occurrence) fail("/app/coordenacao", "Atendimento não encontrado.");
  const actor = await requireInstitutionAccess(occurrence.series.institutionId);
  await prisma.occurrence.update({
    where: { id },
    data: { cancelled: true, cancelReason: reason, cancelledById: actor.id },
  });
  await audit(actor.id, "CANCEL_OCCURRENCE", "Occurrence", id, reason);
  await notifyPeople({
    title: `Atendimento cancelado: ${occurrence.series.institution.name}`,
    body: `O atendimento de ${occurrence.date.toLocaleDateString("pt-BR")} em ${occurrence.series.institution.name} foi cancelado. Motivo: ${reason}`,
    personIds: occurrence.scale.map((entry) => entry.personId),
    kind: "OPS",
  });
  revalidatePath(`/app/coordenacao/${occurrence.series.institutionId}`);
  revalidatePath("/app/agenda");
  revalidatePath("/app/notificacoes");
}

export async function markParticipation(formData: FormData) {
  const occurrenceId = field(formData, "occurrenceId");
  const personId = field(formData, "personId");
  const extra = field(formData, "extra") === "on" || field(formData, "extra") === "true";
  const state = field(formData, "state") || "PRESENTE";
  const occurrence = await prisma.occurrence.findUnique({
    where: { id: occurrenceId },
    include: { series: true },
  });
  if (!occurrence) fail("/app/coordenacao", "Atendimento não encontrado.");
  const actor = await requireInstitutionAccess(occurrence.series.institutionId);
  const path = `/app/coordenacao/${occurrence.series.institutionId}`;
  if (!isToday(occurrence.date)) {
    fail(path, "Presença só pode ser lançada no mesmo dia do atendimento.");
  }
  if (occurrence.closedAt && !isToday(occurrence.date)) {
    fail(path, "A lista deste atendimento já foi fechada.");
  }
  if (!["PRESENTE", "AUSENTE", "ATRASADO"].includes(state)) {
    fail(path, "Situação de presença inválida.");
  }

  await prisma.participation.upsert({
    where: { occurrenceId_personId: { occurrenceId, personId } },
    update: { state, extra: extra && state === "PRESENTE", recordedAt: new Date() },
    create: {
      occurrenceId,
      personId,
      state,
      extra: extra && state === "PRESENTE",
    },
  });
  await audit(actor.id, "MARK_ATTENDANCE", "Occurrence", occurrenceId, state);
  revalidatePath(path);
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

export async function attachOccurrencePhoto(formData: FormData) {
  const id = field(formData, "id");
  const occurrence = await prisma.occurrence.findUnique({
    where: { id },
    include: { series: true, scale: { include: { person: true } } },
  });
  if (!occurrence) fail("/app/coordenacao", "Atendimento não encontrado.");
  const actor = await requireInstitutionAccess(occurrence.series.institutionId);
  const path = `/app/coordenacao/${occurrence.series.institutionId}`;
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    fail(path, "Anexe uma foto ou PDF permitido.");
  }
  try {
    const photoUrl = await saveUpload(file, "ocorrencias");
    await prisma.occurrence.update({
      where: { id },
      data: { photoUrl, photoApproved: false },
    });
    await audit(actor.id, "OCCURRENCE_PHOTO", "Occurrence", id, "Arquivo enviado para moderação");
    revalidatePath(path);
    revalidatePath("/app/admin/moderacao");
  } catch (error) {
    fail(path, error instanceof Error ? error.message : "Não foi possível salvar o arquivo.");
  }
}

export async function requestReopenAttendance(formData: FormData) {
  const id = field(formData, "id");
  const reason = field(formData, "reason");
  if (!reason) fail("/app/coordenacao", "Informe a justificativa para reabrir a lista.");
  const occurrence = await prisma.occurrence.findUnique({
    where: { id },
    include: { series: { include: { institution: true } } },
  });
  if (!occurrence) fail("/app/coordenacao", "Atendimento não encontrado.");
  const actor = await requireInstitutionAccess(occurrence.series.institutionId);
  const path = `/app/coordenacao/${occurrence.series.institutionId}`;
  if (!occurrence.closedAt) fail(path, "Esta lista ainda está aberta.");
  if (isToday(occurrence.date)) {
    fail(path, "No mesmo dia a coordenação corrige a presença direto, sem segunda aprovação.");
  }
  const pending = await prisma.dualApproval.findFirst({
    where: { type: "REOPEN_ATTENDANCE", entityId: id, status: "PENDING" },
  });
  if (pending) fail(path, "Já existe um pedido de reabertura aguardando a secretaria.");
  await prisma.dualApproval.create({
    data: {
      type: "REOPEN_ATTENDANCE",
      entity: "Occurrence",
      entityId: id,
      payload: JSON.stringify({ institutionId: occurrence.series.institutionId }),
      reason,
      requestedById: actor.id,
    },
  });
  await audit(actor.id, "REQUEST_REOPEN", "Occurrence", id, reason);
  revalidatePath(path);
  revalidatePath("/app/admin/aprovacoes");
  revalidatePath("/app");
  ok(path);
}
