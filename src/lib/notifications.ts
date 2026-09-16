import { prisma } from "@/lib/db";
import { ADMIN_ROLES, AUDIENCE_LABELS, COMPETENCY_LABELS, ROLE_LABELS } from "@/lib/labels";
import { isLinkActive } from "@/lib/links";

type AudiencePerson = {
  id: string;
  isSuperAdmin: boolean;
  muteOptionalNotifications: boolean;
  congregation: { cityId: string };
  roles: { role: string; endAt: Date | null }[];
  competencies: { competency: string }[];
  links: {
    institutionId: string;
    startAt: Date;
    endAt: Date | null;
    institution: { sectorId: string; cityId: string };
  }[];
  scaleEntries: { id: string }[];
};

export function isOptionalNotification(kind: string) {
  return kind === "INFO";
}

export const AUDIENCE_KEYS = [
  "todos",
  "admin",
  "vinculados",
  "escalados",
  "papel",
  "competencia",
  "instituicao",
  "setor",
  "cidade",
] as const;

export function resolveAudienceRef(audience: string, formData: FormData) {
  if (audience === "papel") return String(formData.get("role") ?? "").trim() || null;
  if (audience === "competencia") return String(formData.get("competency") ?? "").trim() || null;
  if (audience === "instituicao") return String(formData.get("institutionId") ?? "").trim() || null;
  if (audience === "setor") return String(formData.get("sectorId") ?? "").trim() || null;
  if (audience === "cidade") return String(formData.get("cityId") ?? "").trim() || null;
  return null;
}

export function personMatchesAudience(person: AudiencePerson, audience: string, audienceRef: string | null, now = new Date()) {
  const activeRoles = person.roles.filter((item) => !item.endAt || item.endAt > now);
  const activeLinks = person.links.filter((link) => isLinkActive({ startAt: link.startAt, endAt: link.endAt }));
  if (audience === "todos" || audience === "musicos") {
    return audience === "todos" ? true : person.competencies.some((item) => item.competency === "MUSICO");
  }
  if (audience === "admin") {
    return (
      person.isSuperAdmin ||
      activeRoles.some((item) => ADMIN_ROLES.includes(item.role as (typeof ADMIN_ROLES)[number]) || item.role === "ENCARREGADO_REGIONAL")
    );
  }
  if (audience === "vinculados") return activeLinks.length > 0;
  if (audience === "escalados") return activeLinks.length > 0 || person.scaleEntries.length > 0;
  if (audience === "papel") return Boolean(audienceRef && activeRoles.some((item) => item.role === audienceRef));
  if (audience === "competencia") {
    return Boolean(audienceRef && person.competencies.some((item) => item.competency === audienceRef));
  }
  if (audience === "instituicao") {
    return Boolean(audienceRef && activeLinks.some((link) => link.institutionId === audienceRef));
  }
  if (audience === "setor") {
    return Boolean(audienceRef && activeLinks.some((link) => link.institution.sectorId === audienceRef));
  }
  if (audience === "cidade") {
    return Boolean(
      audienceRef &&
        (person.congregation.cityId === audienceRef || activeLinks.some((link) => link.institution.cityId === audienceRef)),
    );
  }
  return true;
}

export async function loadAudiencePeople() {
  return prisma.person.findMany({
    where: { status: "ACTIVE" },
    include: {
      congregation: true,
      competencies: true,
      links: { include: { institution: true } },
      roles: true,
      scaleEntries: {
        where: { occurrence: { cancelled: false, date: { gte: new Date() } } },
        take: 1,
      },
    },
  });
}

export async function deliverNotification(notificationId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.sentAt) return;
  if (notification.scheduledAt && notification.scheduledAt > new Date()) return;

  const people = await loadAudiencePeople();
  const recipients = people.filter(
    (person) =>
      personMatchesAudience(person, notification.audience, notification.audienceRef) &&
      (!isOptionalNotification(notification.kind) || !person.muteOptionalNotifications),
  );
  if (recipients.length > 0) {
    await prisma.notificationReceipt.createMany({
      data: recipients.map((person) => ({ notificationId, personId: person.id })),
    });
  }
  await prisma.notification.update({
    where: { id: notificationId },
    data: { sentAt: new Date() },
  });
}

export async function deliverScheduledNotifications() {
  const due = await prisma.notification.findMany({
    where: {
      sentAt: null,
      scheduledAt: { not: null, lte: new Date() },
    },
    select: { id: true },
  });
  for (const item of due) {
    await deliverNotification(item.id);
  }
}

export async function notifyPeople(input: {
  title: string;
  body: string;
  personIds: string[];
  kind?: string;
  requiresAck?: boolean;
}) {
  const unique = [...new Set(input.personIds.filter(Boolean))];
  if (unique.length === 0) return;
  const kind = input.kind ?? "OPS";
  const people = await prisma.person.findMany({
    where: { id: { in: unique }, status: "ACTIVE" },
    select: { id: true, muteOptionalNotifications: true },
  });
  const recipients = people.filter((person) => !isOptionalNotification(kind) || !person.muteOptionalNotifications);
  const notification = await prisma.notification.create({
    data: {
      title: input.title,
      body: input.body,
      audience: "pessoas",
      kind,
      requiresAck: input.requiresAck ?? false,
      sentAt: new Date(),
    },
  });
  if (recipients.length > 0) {
    await prisma.notificationReceipt.createMany({
      data: recipients.map((person) => ({ notificationId: notification.id, personId: person.id })),
    });
  }
  return notification;
}

export async function remindUpcomingEvents() {
  const now = new Date();
  const until = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const events = await prisma.regionalEvent.findMany({
    where: {
      cancelled: false,
      remindedAt: null,
      startsAt: { gte: now, lte: until },
    },
  });
  for (const event of events) {
    const audience = event.mandatory ? "todos" : event.audience || "escalados";
    const notification = await prisma.notification.create({
      data: {
        title: `Lembrete: ${event.title}`,
        body: `${event.title} em ${event.location}. Evento ${event.mandatory ? "obrigatório para toda a regional" : "para o público convocado"}.`,
        audience,
        kind: event.mandatory ? "MANDATORY" : "OPS",
        requiresAck: event.mandatory,
      },
    });
    await deliverNotification(notification.id);
    await prisma.regionalEvent.update({
      where: { id: event.id },
      data: { remindedAt: now },
    });
  }
}

export function notificationIsLive(scheduledAt: Date | null, sentAt: Date | null, now = new Date()) {
  if (scheduledAt && scheduledAt > now) return false;
  if (sentAt) return true;
  return !scheduledAt;
}

export function audienceCaption(
  audience: string,
  audienceRef: string | null,
  catalogs: {
    institutions: { id: string; name: string }[];
    sectors: { id: string; code: number; name: string }[];
    cities: { id: string; name: string }[];
  },
) {
  const base = AUDIENCE_LABELS[audience] ?? audience;
  if (!audienceRef) return base;
  if (audience === "papel") return `${base}: ${ROLE_LABELS[audienceRef] ?? audienceRef}`;
  if (audience === "competencia") return `${base}: ${COMPETENCY_LABELS[audienceRef] ?? audienceRef}`;
  if (audience === "instituicao") {
    return `${base}: ${catalogs.institutions.find((item) => item.id === audienceRef)?.name ?? audienceRef}`;
  }
  if (audience === "setor") {
    const sector = catalogs.sectors.find((item) => item.id === audienceRef);
    return `${base}: ${sector ? `${sector.code}. ${sector.name}` : audienceRef}`;
  }
  if (audience === "cidade") {
    return `${base}: ${catalogs.cities.find((item) => item.id === audienceRef)?.name ?? audienceRef}`;
  }
  return base;
}
