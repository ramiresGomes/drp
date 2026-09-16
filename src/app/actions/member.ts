"use server";

import { addDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { fail, field, ok, optionalDate } from "@/lib/forms";
import { distanceMeters, parseCoordinate } from "@/lib/geo";
import { requirePerson } from "@/lib/session";
import { toDay } from "@/lib/dates";

export async function submitJustification(formData: FormData) {
  const person = await requirePerson();
  const occurrenceId = field(formData, "occurrenceId");
  const eventId = field(formData, "eventId");
  const reason = field(formData, "reason");
  if (!reason) fail("/app/agenda", "Informe a justificativa.");
  if (eventId) {
    const event = await prisma.regionalEvent.findUnique({ where: { id: eventId } });
    if (!event || event.cancelled) fail("/app/agenda", "Evento não encontrado.");
    const existing = await prisma.justification.findFirst({
      where: { eventId, personId: person.id },
    });
    if (existing) {
      await prisma.justification.update({ where: { id: existing.id }, data: { reason } });
    } else {
      await prisma.justification.create({ data: { eventId, personId: person.id, reason } });
    }
    revalidatePath("/app/agenda");
    return;
  }

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
  const latitude = parseCoordinate(field(formData, "latitude"));
  const longitude = parseCoordinate(field(formData, "longitude"));
  const event = await prisma.regionalEvent.findUnique({ where: { checkinToken: token } });
  if (!event || event.cancelled) fail("/app/agenda", "Evento não encontrado ou cancelado.");

  const now = new Date();
  const opensAt = new Date(event.startsAt.getTime() - 30 * 60 * 1000);
  if (now < opensAt || now > event.endsAt) {
    fail(
      `/app/checkin/${token}`,
      `O QR registra presença durante o evento (${event.startsAt.toLocaleString("pt-BR")} até ${event.endsAt.toLocaleString("pt-BR")}).`,
    );
  }

  if (event.latitude != null && event.longitude != null) {
    if (latitude == null || longitude == null) {
      fail(`/app/checkin/${token}`, "O check-in deste evento exige localização no aparelho.");
    }
    const meters = distanceMeters(event.latitude, event.longitude, latitude, longitude);
    if (meters > event.radiusMeters) {
      fail(
        `/app/checkin/${token}`,
        `Localização incompatível (${Math.round(meters)} m do local). O QR só registra presença no recinto.`,
      );
    }
  }

  await prisma.eventAttendance.upsert({
    where: { eventId_personId: { eventId: event.id, personId: person.id } },
    update: { present: true, latitude, longitude },
    create: { eventId: event.id, personId: person.id, present: true, latitude, longitude },
  });
  revalidatePath("/app/agenda");
  revalidatePath(`/app/checkin/${token}`);
  ok("/app/agenda");
}

export async function addAvailabilityBlock(formData: FormData) {
  const person = await requirePerson();
  const startAt = optionalDate(formData, "startAt");
  const endAt = optionalDate(formData, "endAt");
  const note = field(formData, "note") || null;
  if (!startAt || !endAt) fail("/app/dados", "Informe o início e o fim do bloqueio.");
  if (endAt < startAt) fail("/app/dados", "O fim do bloqueio precisa ser igual ou posterior ao início.");
  await prisma.availabilityBlock.create({
    data: { personId: person.id, startAt, endAt, note },
  });
  revalidatePath("/app/dados");
  ok("/app/dados");
}

export async function deleteAvailabilityBlock(formData: FormData) {
  const person = await requirePerson();
  const id = field(formData, "id");
  await prisma.availabilityBlock.deleteMany({ where: { id, personId: person.id } });
  revalidatePath("/app/dados");
  ok("/app/dados");
}

export async function updateNotificationPreference(formData: FormData) {
  const person = await requirePerson();
  await prisma.person.update({
    where: { id: person.id },
    data: { muteOptionalNotifications: field(formData, "muteOptional") === "on" },
  });
  revalidatePath("/app/dados");
  revalidatePath("/app/notificacoes");
  ok("/app/dados");
}

export async function submitLgpdRequest(formData: FormData) {
  const person = await requirePerson();
  const type = field(formData, "type");
  const reason = field(formData, "reason");
  if (!["ACCESS", "CORRECTION", "ERASURE"].includes(type) || !reason) {
    fail("/app/dados", "Informe o tipo do pedido e a justificativa.");
  }
  await prisma.lgpdRequest.create({
    data: { personId: person.id, type, reason },
  });
  revalidatePath("/app/dados");
  revalidatePath("/app/admin/lgpd");
  ok("/app/dados");
}
