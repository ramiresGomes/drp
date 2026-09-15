"use server";

import { randomBytes } from "crypto";
import { addHours } from "date-fns";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { checked, fail, field } from "@/lib/forms";
import { musicianSingerConflict } from "@/lib/permissions";
import { ensureOccurrences } from "@/lib/occurrences";
import { requireAdmin } from "@/lib/session";

function nextWeekday(weekday: number, from = new Date()) {
  const date = new Date(from);
  date.setHours(9, 0, 0, 0);
  const delta = (weekday + 7 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + delta);
  return date;
}

export async function createCity(formData: FormData) {
  const actor = await requireAdmin();
  const name = field(formData, "name");
  if (!name) fail("/app/admin/cidades", "Informe o nome da cidade.");
  const city = await prisma.city.create({
    data: { name, isSeat: checked(formData, "isSeat") },
  });
  await audit(actor.id, "CREATE_CITY", "City", city.id, name);
  revalidatePath("/app/admin/cidades");
}

export async function createCongregation(formData: FormData) {
  const actor = await requireAdmin();
  const name = field(formData, "name");
  const cityId = field(formData, "cityId");
  if (!name || !cityId) fail("/app/admin/cidades", "Comum e cidade são obrigatórios.");
  const congregation = await prisma.congregation.create({ data: { name, cityId } });
  await audit(actor.id, "CREATE_CONGREGATION", "Congregation", congregation.id, name);
  revalidatePath("/app/admin/cidades");
}

export async function createInstitution(formData: FormData) {
  const actor = await requireAdmin();
  const name = field(formData, "name");
  const address = field(formData, "address");
  const cityId = field(formData, "cityId");
  const sectorId = field(formData, "sectorId");
  const phone = field(formData, "phone") || null;
  const mapsUrl = field(formData, "mapsUrl") || null;
  const notes = field(formData, "notes") || null;
  const capacityRaw = field(formData, "capacity");
  if (!name || !address || !cityId || !sectorId) {
    fail("/app/admin/instituicoes", "Nome, endereço, cidade e setor são obrigatórios.");
  }
  const institution = await prisma.institution.create({
    data: {
      name,
      address,
      cityId,
      sectorId,
      phone,
      mapsUrl,
      notes,
      capacity: capacityRaw ? Number(capacityRaw) : null,
      requiresRecadastramento: checked(formData, "requiresRecadastramento"),
    },
  });
  await audit(actor.id, "CREATE_INSTITUTION", "Institution", institution.id, name);
  revalidatePath("/app/admin/instituicoes");
}

export async function createPerson(formData: FormData) {
  const actor = await requireAdmin();
  const name = field(formData, "name");
  const email = field(formData, "email").toLowerCase();
  const phone = field(formData, "phone");
  const congregationId = field(formData, "congregationId");
  const birthDate = field(formData, "birthDate");
  const notes = field(formData, "notes") || null;
  const roles = formData.getAll("roles").map(String);
  const competencies = formData.getAll("competencies").map(String);
  const isMinor = checked(formData, "isMinor");

  if (!name || !email || !phone || !congregationId || !birthDate) {
    fail("/app/admin/pessoas", "Nome, e-mail, telefone, comum e nascimento são obrigatórios.");
  }
  if (musicianSingerConflict(competencies)) {
    fail("/app/admin/pessoas", "A pessoa não pode ser músico e cantor ao mesmo tempo.");
  }

  const person = await prisma.person.create({
    data: {
      name,
      email,
      phone,
      congregationId,
      birthDate: new Date(`${birthDate}T12:00:00`),
      notes,
      isMinor,
      consentAt: isMinor ? new Date() : null,
      roles: { create: roles.map((role) => ({ role })) },
      competencies: { create: competencies.map((competency) => ({ competency })) },
    },
  });
  await audit(actor.id, "CREATE_PERSON", "Person", person.id, `Cadastro Darpe de ${name}`);
  revalidatePath("/app/admin/pessoas");
}

export async function createInstitutionLink(formData: FormData) {
  const actor = await requireAdmin();
  const personId = field(formData, "personId");
  const institutionId = field(formData, "institutionId");
  if (!personId || !institutionId) {
    fail("/app/admin/vinculos", "Pessoa e instituição são obrigatórias.");
  }

  const existing = await prisma.institutionLink.findUnique({
    where: { institutionId_personId: { institutionId, personId } },
  });
  if (existing) {
    await prisma.institutionLink.update({
      where: { id: existing.id },
      data: { endAt: null, justification: null },
    });
  } else {
    await prisma.institutionLink.create({
      data: { personId, institutionId, createdById: actor.id },
    });
  }
  await audit(actor.id, "CREATE_LINK", "InstitutionLink", institutionId, "Vínculo institucional concedido");
  revalidatePath("/app/admin/vinculos");
}

export async function revokeInstitutionLink(formData: FormData) {
  const actor = await requireAdmin();
  const id = field(formData, "id");
  const justification = field(formData, "justification") || "Vínculo encerrado pela secretaria.";
  await prisma.institutionLink.update({
    where: { id },
    data: { endAt: new Date(), justification },
  });
  await audit(actor.id, "REVOKE_LINK", "InstitutionLink", id, justification);
  revalidatePath("/app/admin/vinculos");
}

export async function setInstitutionResponsible(formData: FormData) {
  const actor = await requireAdmin();
  const personId = field(formData, "personId");
  const institutionId = field(formData, "institutionId");
  if (!personId || !institutionId) {
    fail("/app/admin/instituicoes", "Pessoa e instituição são obrigatórias.");
  }
  await prisma.institutionResponsible.upsert({
    where: { institutionId_personId: { institutionId, personId } },
    update: {},
    create: { personId, institutionId },
  });
  await audit(actor.id, "SET_RESPONSIBLE", "Institution", institutionId, "Responsável definido");
  revalidatePath("/app/admin/instituicoes");
}

export async function createSeries(formData: FormData) {
  const actor = await requireAdmin();
  const institutionId = field(formData, "institutionId");
  const weekday = Number(field(formData, "weekday") || "6");
  const intervalDays = Number(field(formData, "intervalDays") || "15");
  const justifyDaysBefore = Number(field(formData, "justifyDaysBefore") || "2");
  const startDateRaw = field(formData, "startDate");
  if (!institutionId) fail("/app/admin/series", "Escolha a instituição.");

  const startDate = startDateRaw ? new Date(`${startDateRaw}T09:00:00`) : nextWeekday(weekday);
  const weekdayLabel = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][weekday] ?? "dia";
  const series = await prisma.recurringSeries.create({
    data: {
      institutionId,
      startDate,
      intervalDays,
      justifyDaysBefore,
      label: `${weekdayLabel} a cada ${intervalDays} dias`,
    },
  });
  await ensureOccurrences(series.id);
  await audit(actor.id, "CREATE_SERIES", "RecurringSeries", series.id, series.label);
  revalidatePath("/app/admin/series");
}

export async function createEventType(formData: FormData) {
  const actor = await requireAdmin();
  const name = field(formData, "name");
  const checklist = field(formData, "checklist");
  if (!name) fail("/app/admin/eventos", "Informe o nome do tipo.");
  const items = checklist
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((label, index) => ({ id: `item-${index + 1}`, label, required: true }));
  await prisma.eventType.create({
    data: {
      name,
      mandatory: checked(formData, "mandatory"),
      checklist: JSON.stringify(items),
    },
  });
  await audit(actor.id, "CREATE_EVENT_TYPE", "EventType", name, name);
  revalidatePath("/app/admin/eventos");
}

export async function createRegionalEvent(formData: FormData) {
  const actor = await requireAdmin();
  const title = field(formData, "title");
  const typeId = field(formData, "typeId");
  const startsAt = field(formData, "startsAt");
  const location = field(formData, "location");
  const presidingElder = field(formData, "presidingElder") || null;
  if (!title || !typeId || !startsAt || !location) {
    fail("/app/admin/eventos", "Título, tipo, data e local são obrigatórios.");
  }
  const type = await prisma.eventType.findUnique({ where: { id: typeId } });
  if (!type) fail("/app/admin/eventos", "Tipo de evento não encontrado.");
  const start = new Date(startsAt);
  const event = await prisma.regionalEvent.create({
    data: {
      title,
      typeId,
      startsAt: start,
      endsAt: addHours(start, 2),
      location,
      mandatory: checked(formData, "mandatory") || type.mandatory,
      checkinToken: randomBytes(12).toString("hex"),
      createdById: actor.id,
      checklistJson: type.checklist,
      presidingElder,
    },
  });
  await audit(actor.id, "CREATE_EVENT", "RegionalEvent", event.id, title);
  revalidatePath("/app/admin/eventos");
}

export async function addBaptismName(formData: FormData) {
  const actor = await requireAdmin();
  const eventId = field(formData, "eventId");
  const fullName = field(formData, "fullName");
  if (!eventId || !fullName) fail("/app/admin/eventos", "Informe o nome do batizando.");
  await prisma.baptism.create({ data: { eventId, fullName } });
  await audit(actor.id, "ADD_BAPTISM", "RegionalEvent", eventId, fullName);
  revalidatePath("/app/admin/eventos");
}

export async function markEventAttendance(formData: FormData) {
  const actor = await requireAdmin();
  const eventId = field(formData, "eventId");
  const personId = field(formData, "personId");
  if (!eventId || !personId) fail("/app/admin/eventos", "Evento e pessoa são obrigatórios.");
  await prisma.eventAttendance.upsert({
    where: { eventId_personId: { eventId, personId } },
    update: { present: true, manual: true },
    create: { eventId, personId, present: true, manual: true },
  });
  await audit(actor.id, "EVENT_ATTENDANCE", "RegionalEvent", eventId, "Presença lançada pela secretaria");
  revalidatePath("/app/admin/eventos");
}

export async function createNotification(formData: FormData) {
  const actor = await requireAdmin();
  const title = field(formData, "title");
  const body = field(formData, "body");
  const audience = field(formData, "audience") || "todos";
  const scheduledAt = field(formData, "scheduledAt");
  if (!title || !body) fail("/app/admin/notificacoes", "Título e texto são obrigatórios.");

  const kind = checked(formData, "mandatory") ? "MANDATORY" : "INFO";
  const people = await prisma.person.findMany({
    where: { status: "ACTIVE" },
    include: { competencies: true, links: true, roles: true },
  });
  const adminRoles = ["SECRETARIO", "ANCIAO_COORDENADOR", "ANCIAO_COMPLEMENTAR", "JURIDICO", "ENCARREGADO_REGIONAL"];
  const audiencePeople = people.filter((person) => {
    if (audience === "todos") return true;
    if (audience === "admin") {
      return person.isSuperAdmin || person.roles.some((item) => adminRoles.includes(item.role));
    }
    if (audience === "vinculados") return person.links.some((link) => !link.endAt || link.endAt > new Date());
    if (audience === "musicos") return person.competencies.some((item) => item.competency === "MUSICO");
    return true;
  });

  const notification = await prisma.notification.create({
    data: {
      title,
      body,
      audience,
      kind,
      requiresAck: checked(formData, "requiresAck") || kind === "MANDATORY",
      requiresConfirm: checked(formData, "requiresConfirm"),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      createdById: actor.id,
      receipts: {
        create: audiencePeople.map((person) => ({ personId: person.id })),
      },
    },
  });
  await audit(actor.id, "CREATE_NOTIFICATION", "Notification", notification.id, title);
  revalidatePath("/app/admin/notificacoes");
}

export async function requestDualApproval(formData: FormData) {
  const actor = await requireAdmin();
  const type = field(formData, "type");
  const entity = field(formData, "entity");
  const entityId = field(formData, "entityId");
  const reason = field(formData, "reason");
  if (!type || !entity || !entityId || !reason) {
    fail("/app/admin/aprovacoes", "Tipo, alvo e justificativa são obrigatórios.");
  }
  await prisma.dualApproval.create({
    data: {
      type,
      entity,
      entityId,
      payload: JSON.stringify({ type, entity, entityId }),
      reason,
      requestedById: actor.id,
    },
  });
  await audit(actor.id, "REQUEST_DUAL", "DualApproval", entityId, reason);
  revalidatePath("/app/admin/aprovacoes");
}

export async function decideDualApproval(formData: FormData) {
  const actor = await requireAdmin();
  const id = field(formData, "id");
  const decision = field(formData, "decision");
  const request = await prisma.dualApproval.findUnique({ where: { id } });
  if (!request || request.status !== "PENDING") {
    fail("/app/admin/aprovacoes", "Pedido não encontrado.");
  }
  if (request.requestedById === actor.id) {
    fail("/app/admin/aprovacoes", "A segunda aprovação precisa ser de outra pessoa da secretaria.");
  }

  if (decision === "reject") {
    await prisma.dualApproval.update({
      where: { id },
      data: { status: "REJECTED", decidedById: actor.id, decidedAt: new Date() },
    });
  } else {
    if (request.type === "CANCEL_MANDATORY_EVENT") {
      await prisma.regionalEvent.update({
        where: { id: request.entityId },
        data: { cancelled: true, cancelReason: request.reason },
      });
    }
    if (request.type === "LGPD_ERASURE") {
      await prisma.person.update({
        where: { id: request.entityId },
        data: {
          status: "ERASED",
          email: `apagado-${request.entityId}@darpe.local`,
          notes: "Apagado por solicitação LGPD.",
        },
      });
    }
    if (request.type === "GRANT_SUPERADMIN") {
      await prisma.person.update({ where: { id: request.entityId }, data: { isSuperAdmin: true } });
    }
    if (request.type === "REVOKE_SUPERADMIN") {
      await prisma.person.update({ where: { id: request.entityId }, data: { isSuperAdmin: false } });
    }
    if (request.type === "REOPEN_ATTENDANCE") {
      await prisma.occurrence.update({
        where: { id: request.entityId },
        data: { closedAt: null },
      });
    }
    await prisma.dualApproval.update({
      where: { id },
      data: { status: "APPROVED", decidedById: actor.id, decidedAt: new Date() },
    });
  }

  await audit(actor.id, `DUAL_${decision.toUpperCase()}`, "DualApproval", id, `${request.type} ${decision}`);
  revalidatePath("/app/admin/aprovacoes");
}
