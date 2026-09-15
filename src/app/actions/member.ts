"use server";

import { addDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { fail, field } from "@/lib/forms";
import { requirePerson } from "@/lib/session";
import { toDay } from "@/lib/dates";

export async function submitJustification(formData: FormData) {
  const person = await requirePerson();
  const occurrenceId = field(formData, "occurrenceId");
  const reason = field(formData, "reason");
  if (!reason) fail("/app/agenda", "Informe a justificativa.");

  const occurrence = await prisma.occurrence.findUnique({
    where: { id: occurrenceId },
    include: { series: true, scale: true },
  });
  if (!occurrence) fail("/app/agenda", "Atendimento não encontrado.");
  const scaled = occurrence.scale.some((entry) => entry.personId === person.id);
  if (!scaled) fail("/app/agenda", "Justificativa só vale para quem está na escala.");

  const deadline = addDays(toDay(occurrence.date), -(occurrence.series.justifyDaysBefore || 2));
  const late = toDay(new Date()) > deadline;
  const text = late ? `${reason} (enviada após o prazo de ${occurrence.series.justifyDaysBefore} dia(s)).` : reason;

  const existing = await prisma.justification.findFirst({
    where: { occurrenceId, personId: person.id },
  });
  if (existing) {
    await prisma.justification.update({ where: { id: existing.id }, data: { reason: text } });
  } else {
    await prisma.justification.create({
      data: { occurrenceId, personId: person.id, reason: text },
    });
  }
  revalidatePath("/app/agenda");
}

export async function saveAvailability(formData: FormData) {
  const person = await requirePerson();
  const weekday = Number(field(formData, "weekday") || "6");
  const available = field(formData, "available") === "on";
  const note = field(formData, "note") || null;
  const existing = await prisma.availability.findFirst({
    where: { personId: person.id, weekday },
  });
  if (existing) {
    await prisma.availability.update({
      where: { id: existing.id },
      data: { available, note },
    });
  } else {
    await prisma.availability.create({
      data: { personId: person.id, weekday, available, note },
    });
  }
  revalidatePath("/app/dados");
}

export async function markNotificationRead(formData: FormData) {
  const person = await requirePerson();
  const notificationId = field(formData, "notificationId");
  await prisma.notificationReceipt.upsert({
    where: { notificationId_personId: { notificationId, personId: person.id } },
    update: { readAt: new Date() },
    create: { notificationId, personId: person.id, readAt: new Date() },
  });
  revalidatePath("/app/notificacoes");
}

export async function ackNotification(formData: FormData) {
  const person = await requirePerson();
  const notificationId = field(formData, "notificationId");
  await prisma.notificationReceipt.upsert({
    where: { notificationId_personId: { notificationId, personId: person.id } },
    update: { scienceAt: new Date(), readAt: new Date() },
    create: { notificationId, personId: person.id, scienceAt: new Date(), readAt: new Date() },
  });
  revalidatePath("/app/notificacoes");
}

export async function confirmNotification(formData: FormData) {
  const person = await requirePerson();
  const notificationId = field(formData, "notificationId");
  await prisma.notificationReceipt.upsert({
    where: { notificationId_personId: { notificationId, personId: person.id } },
    update: { confirmedAt: new Date(), readAt: new Date() },
    create: { notificationId, personId: person.id, confirmedAt: new Date(), readAt: new Date() },
  });
  revalidatePath("/app/notificacoes");
}

export async function updateOwnProfile(formData: FormData) {
  const person = await requirePerson();
  const phone = field(formData, "phone");
  const notes = field(formData, "notes") || null;
  if (!phone) fail("/app/dados", "Informe um telefone.");
  await prisma.person.update({
    where: { id: person.id },
    data: { phone, notes },
  });
  revalidatePath("/app/dados");
}

export async function checkInEvent(formData: FormData) {
  const person = await requirePerson();
  const token = field(formData, "token");
  const event = await prisma.regionalEvent.findUnique({ where: { checkinToken: token } });
  if (!event || event.cancelled) fail("/app/agenda", "Evento não encontrado ou cancelado.");
  await prisma.eventAttendance.upsert({
    where: { eventId_personId: { eventId: event.id, personId: person.id } },
    update: { present: true },
    create: { eventId: event.id, personId: person.id, present: true },
  });
  revalidatePath("/app/agenda");
}
