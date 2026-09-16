"use server";

import { randomBytes } from "crypto";
import { addHours } from "date-fns";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { parseChecklist } from "@/lib/checklist";
import { prisma } from "@/lib/db";
import { checked, fail, field, ok, optionalDate } from "@/lib/forms";
import { parseCoordinate } from "@/lib/geo";
import { STATUS_LABELS } from "@/lib/labels";
import { canUseCoordinatorPanel, isAdmin, musicianSingerConflict } from "@/lib/permissions";
import { ensureOccurrences } from "@/lib/occurrences";
import { deliverNotification, notifyPeople, resolveAudienceRef } from "@/lib/notifications";
import { reportQuery, type ReportFilters } from "@/lib/reports";
import { requireAdmin, requireLinker, requirePerson } from "@/lib/session";

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
  ok("/app/admin/instituicoes");
}

export async function setInstitutionActive(formData: FormData) {
  const actor = await requireAdmin();
  const id = field(formData, "id");
  const active = field(formData, "active") === "true";
  await prisma.institution.update({
    where: { id },
    data: { active },
  });
  await audit(
    actor.id,
    active ? "ACTIVATE_INSTITUTION" : "DEACTIVATE_INSTITUTION",
    "Institution",
    id,
    active ? "Instituição reativada" : "Instituição inativada sem apagar histórico",
  );
  revalidatePath("/app/admin/instituicoes");
  ok("/app/admin/instituicoes");
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
  ok("/app/admin/pessoas");
}

export async function updatePerson(formData: FormData) {
  const actor = await requireAdmin();
  const id = field(formData, "id");
  const name = field(formData, "name");
  const email = field(formData, "email").toLowerCase();
  const phone = field(formData, "phone");
  const congregationId = field(formData, "congregationId");
  const birthDate = field(formData, "birthDate");
  const notes = field(formData, "notes") || null;
  const status = field(formData, "status") || "ACTIVE";
  const roles = formData.getAll("roles").map(String);
  const competencies = formData.getAll("competencies").map(String);
  const isMinor = checked(formData, "isMinor");
  const path = `/app/admin/pessoas/${id}`;

  if (!id || !name || !email || !phone || !congregationId || !birthDate) {
    fail(path, "Nome, e-mail, telefone, comum e nascimento são obrigatórios.");
  }
  if (!(status in STATUS_LABELS) || status === "ERASED") {
    fail(path, "Situação inválida. Exclusão definitiva só pelo fluxo LGPD.");
  }
  if (musicianSingerConflict(competencies)) {
    fail(path, "A pessoa não pode ser músico e cantor ao mesmo tempo.");
  }

  const current = await prisma.person.findUnique({ where: { id } });
  if (!current || current.status === "ERASED") {
    fail("/app/admin/pessoas", "Pessoa não encontrada.");
  }

  await prisma.$transaction([
    prisma.person.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        congregationId,
        birthDate: new Date(`${birthDate}T12:00:00`),
        notes,
        status,
        isMinor,
        consentAt: isMinor ? current.consentAt ?? new Date() : current.consentAt,
        religiousConsentAt: checked(formData, "religiousConsent")
          ? current.religiousConsentAt ?? new Date()
          : null,
        photoConsentAt: checked(formData, "photoConsent") ? current.photoConsentAt ?? new Date() : null,
        documentExpiresAt: optionalDate(formData, "documentExpiresAt"),
      },
    }),
    prisma.personRole.deleteMany({ where: { personId: id } }),
    ...(roles.length
      ? [prisma.personRole.createMany({ data: roles.map((role) => ({ personId: id, role })) })]
      : []),
    prisma.personCompetency.deleteMany({ where: { personId: id } }),
    ...(competencies.length
      ? [
          prisma.personCompetency.createMany({
            data: competencies.map((competency) => ({ personId: id, competency })),
          }),
        ]
      : []),
  ]);
  await audit(actor.id, "UPDATE_PERSON", "Person", id, `Cadastro atualizado · ${STATUS_LABELS[status]}`);
  revalidatePath("/app/admin/pessoas");
  revalidatePath(path);
  ok(path);
}

export async function createInstitutionLink(formData: FormData) {
  const actor = await requireLinker();
  const personId = field(formData, "personId");
  const institutionId = field(formData, "institutionId");
  const justification = field(formData, "justification") || null;
  const startAt = optionalDate(formData, "startAt") ?? new Date();
  const endAt = optionalDate(formData, "endAt");
  if (!personId || !institutionId) {
    fail("/app/admin/vinculos", "Pessoa e instituição são obrigatórias.");
  }
  if (endAt && endAt <= startAt) {
    fail("/app/admin/vinculos", "A vigência final precisa ser posterior ao início.");
  }

  const institution = await prisma.institution.findUnique({ where: { id: institutionId } });
  if (!institution || !institution.active) {
    fail("/app/admin/vinculos", "Não é possível vincular a uma instituição inativa.");
  }
  if (institution.requiresRecadastramento && !endAt) {
    fail("/app/admin/vinculos", "Esta instituição exige data final de recadastramento.");
  }

  const existing = await prisma.institutionLink.findUnique({
    where: { institutionId_personId: { institutionId, personId } },
  });
  if (existing) {
    await prisma.institutionLink.update({
      where: { id: existing.id },
      data: { endAt, startAt, justification, createdById: actor.id },
    });
  } else {
    await prisma.institutionLink.create({
      data: { personId, institutionId, createdById: actor.id, startAt, endAt, justification },
    });
  }
  await audit(actor.id, "CREATE_LINK", "InstitutionLink", institutionId, "Vínculo institucional concedido");
  revalidatePath("/app/admin/vinculos");
  ok("/app/admin/vinculos");
}

export async function revokeInstitutionLink(formData: FormData) {
  const actor = await requireLinker();
  const id = field(formData, "id");
  const justification = field(formData, "justification") || "Vínculo encerrado pela secretaria.";
  await prisma.institutionLink.update({
    where: { id },
    data: { endAt: new Date(), justification },
  });
  await audit(actor.id, "REVOKE_LINK", "InstitutionLink", id, justification);
  revalidatePath("/app/admin/vinculos");
  ok("/app/admin/vinculos");
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
  const institution = await prisma.institution.findUnique({ where: { id: institutionId } });
  if (!institution || !institution.active) fail("/app/admin/series", "Não é possível criar série para instituição inativa.");

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
  ok("/app/admin/series");
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
      audience: field(formData, "audience") || "todos",
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
  const endsAtRaw = field(formData, "endsAt");
  const latitude = parseCoordinate(field(formData, "latitude"));
  const longitude = parseCoordinate(field(formData, "longitude"));
  const radiusRaw = field(formData, "radiusMeters");
  if ((latitude == null) !== (longitude == null)) {
    fail("/app/admin/eventos", "Informe latitude e longitude juntas, ou deixe as duas em branco.");
  }
  const event = await prisma.regionalEvent.create({
    data: {
      title,
      typeId,
      startsAt: start,
      endsAt: endsAtRaw ? new Date(endsAtRaw) : addHours(start, 2),
      location,
      latitude,
      longitude,
      radiusMeters: radiusRaw ? Number(radiusRaw) : 250,
      mandatory: checked(formData, "mandatory") || type.mandatory,
      audience: type.audience || "todos",
      checkinToken: randomBytes(12).toString("hex"),
      createdById: actor.id,
      checklistJson: type.checklist,
      presidingElder,
    },
  });
  await audit(actor.id, "CREATE_EVENT", "RegionalEvent", event.id, title);
  revalidatePath("/app/admin/eventos");
  ok("/app/admin/eventos");
}

export async function toggleChecklistItem(formData: FormData) {
  const actor = await requireAdmin();
  const eventId = field(formData, "eventId");
  const itemId = field(formData, "itemId");
  const event = await prisma.regionalEvent.findUnique({ where: { id: eventId } });
  if (!event) fail("/app/admin/eventos", "Evento não encontrado.");
  const items = parseChecklist(event.checklistJson).map((item) =>
    item.id === itemId ? { ...item, done: !item.done } : item,
  );
  await prisma.regionalEvent.update({
    where: { id: eventId },
    data: { checklistJson: JSON.stringify(items) },
  });
  await audit(actor.id, "EVENT_CHECKLIST", "RegionalEvent", eventId, `Checklist ${itemId}`);
  revalidatePath("/app/admin/eventos");
}

export async function addBaptismName(formData: FormData) {
  const actor = await requirePerson();
  if (!isAdmin(actor) && !canUseCoordinatorPanel(actor)) {
    fail("/app/agenda", "Sem permissão para registrar batizando.");
  }
  const eventId = field(formData, "eventId");
  const fullName = field(formData, "fullName");
  const from = field(formData, "from") || "/app/admin/eventos";
  if (!eventId || !fullName) fail(from, "Informe o nome do batizando.");
  const event = await prisma.regionalEvent.findUnique({ where: { id: eventId }, include: { type: true } });
  if (!event || event.cancelled) fail(from, "Evento não encontrado.");
  await prisma.baptism.create({ data: { eventId, fullName } });
  await audit(actor.id, "ADD_BAPTISM", "RegionalEvent", eventId, fullName);
  revalidatePath("/app/admin/eventos");
  revalidatePath("/app/agenda");
  ok(from);
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
  const audienceRef = resolveAudienceRef(audience, formData);
  const scheduledAt = optionalDate(formData, "scheduledAt");
  if (!title || !body) fail("/app/admin/notificacoes", "Título e texto são obrigatórios.");
  if (["papel", "competencia", "instituicao", "setor", "cidade"].includes(audience) && !audienceRef) {
    fail("/app/admin/notificacoes", "Informe o recorte do público.");
  }

  const kind = checked(formData, "mandatory") ? "MANDATORY" : "INFO";
  const sendNow = !scheduledAt || scheduledAt <= new Date();
  const notification = await prisma.notification.create({
    data: {
      title,
      body,
      audience,
      audienceRef,
      kind,
      requiresAck: checked(formData, "requiresAck") || kind === "MANDATORY",
      requiresConfirm: checked(formData, "requiresConfirm"),
      scheduledAt,
      createdById: actor.id,
    },
  });
  if (sendNow) await deliverNotification(notification.id);
  await audit(
    actor.id,
    sendNow ? "CREATE_NOTIFICATION" : "SCHEDULE_NOTIFICATION",
    "Notification",
    notification.id,
    title,
  );
  revalidatePath("/app/admin/notificacoes");
  revalidatePath("/app/notificacoes");
  revalidatePath("/app");
  ok("/app/admin/notificacoes");
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
      const event = await prisma.regionalEvent.update({
        where: { id: request.entityId },
        data: { cancelled: true, cancelReason: request.reason },
      });
      await notifyPeople({
        title: `Evento cancelado: ${event.title}`,
        body: `${event.title} foi cancelado. Motivo: ${request.reason}`,
        personIds: (
          await prisma.person.findMany({ where: { status: "ACTIVE" }, select: { id: true } })
        ).map((person) => person.id),
        kind: "MANDATORY",
        requiresAck: true,
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
      await prisma.lgpdRequest.updateMany({
        where: { personId: request.entityId, type: "ERASURE", status: { in: ["PENDING", "FORWARDED"] } },
        data: { status: "DONE", handledAt: new Date(), handledById: actor.id },
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
  revalidatePath("/app/admin/lgpd");
}

export async function moderateOccurrencePhoto(formData: FormData) {
  const actor = await requireAdmin();
  const id = field(formData, "id");
  const decision = field(formData, "decision");
  const occurrence = await prisma.occurrence.findUnique({ where: { id } });
  if (!occurrence?.photoUrl) fail("/app/admin/moderacao", "Não há arquivo para moderar.");
  if (decision === "reject") {
    await prisma.occurrence.update({
      where: { id },
      data: { photoUrl: null, photoApproved: false },
    });
    await audit(actor.id, "PHOTO_REJECT", "Occurrence", id, "Arquivo recusado na moderação");
  } else {
    await prisma.occurrence.update({ where: { id }, data: { photoApproved: true } });
    await audit(actor.id, "PHOTO_APPROVE", "Occurrence", id, "Arquivo aprovado na moderação");
  }
  revalidatePath("/app/admin/moderacao");
  ok("/app/admin/moderacao");
}

export async function updateChecklistDetails(formData: FormData) {
  const actor = await requireAdmin();
  const eventId = field(formData, "eventId");
  const itemId = field(formData, "itemId");
  const event = await prisma.regionalEvent.findUnique({ where: { id: eventId } });
  if (!event) fail("/app/admin/eventos", "Evento não encontrado.");
  const items = parseChecklist(event.checklistJson).map((item) =>
    item.id === itemId
      ? {
          ...item,
          owner: field(formData, "owner"),
          dueAt: field(formData, "dueAt"),
          evidence: field(formData, "evidence"),
        }
      : item,
  );
  await prisma.regionalEvent.update({
    where: { id: eventId },
    data: { checklistJson: JSON.stringify(items) },
  });
  await audit(actor.id, "EVENT_CHECKLIST_DETAIL", "RegionalEvent", eventId, itemId);
  revalidatePath("/app/admin/eventos");
  revalidatePath("/app");
}

export async function handleLgpdRequest(formData: FormData) {
  const actor = await requireAdmin();
  const id = field(formData, "id");
  const decision = field(formData, "decision");
  const request = await prisma.lgpdRequest.findUnique({ where: { id } });
  if (!request || request.status !== "PENDING") {
    fail("/app/admin/lgpd", "Pedido LGPD não encontrado.");
  }
  if (request.type === "ERASURE" && decision !== "forward" && decision !== "reject") {
    fail("/app/admin/lgpd", "Exclusão definitiva só segue pela dupla aprovação.");
  }
  if (request.type === "ERASURE" && decision === "forward") {
    await prisma.lgpdRequest.update({
      where: { id },
      data: { status: "FORWARDED", handledById: actor.id, handledAt: new Date() },
    });
    await prisma.dualApproval.create({
      data: {
        type: "LGPD_ERASURE",
        entity: "Person",
        entityId: request.personId,
        payload: JSON.stringify({ lgpdRequestId: id }),
        reason: request.reason,
        requestedById: actor.id,
      },
    });
    await audit(actor.id, "LGPD_FORWARD", "LgpdRequest", id, "Pedido de exclusão encaminhado à dupla aprovação");
    revalidatePath("/app/admin/lgpd");
    revalidatePath("/app/admin/aprovacoes");
    ok("/app/admin/lgpd");
  }
  await prisma.lgpdRequest.update({
    where: { id },
    data: {
      status: decision === "reject" ? "REJECTED" : "DONE",
      handledById: actor.id,
      handledAt: new Date(),
    },
  });
  await audit(actor.id, "LGPD_HANDLE", "LgpdRequest", id, `${request.type} ${decision}`);
  revalidatePath("/app/admin/lgpd");
  ok("/app/admin/lgpd");
}

export async function saveReportTemplate(formData: FormData) {
  const actor = await requireAdmin();
  const name = field(formData, "name");
  if (!name) fail("/app/admin/relatorios", "Informe o nome do modelo.");
  const filters: ReportFilters = {
    setor: field(formData, "setor") || null,
    cidade: field(formData, "cidade") || null,
    situacao: field(formData, "situacao") || null,
    fato: field(formData, "fato") || "atendimentos",
    anonimizado: field(formData, "anonimizado") || "1",
    periodo: field(formData, "periodo") || "mes",
  };
  await prisma.reportTemplate.create({
    data: {
      name,
      filtersJson: JSON.stringify(filters),
      anonymized: filters.anonimizado !== "0",
      createdById: actor.id,
    },
  });
  await audit(actor.id, "SAVE_REPORT_TEMPLATE", "ReportTemplate", name, name);
  const query = reportQuery(filters);
  ok(`/app/admin/relatorios${query.size ? `?${query.toString()}` : ""}`);
}

export async function deleteReportTemplate(formData: FormData) {
  const actor = await requireAdmin();
  const id = field(formData, "id");
  await prisma.reportTemplate.delete({ where: { id } });
  await audit(actor.id, "DELETE_REPORT_TEMPLATE", "ReportTemplate", id, "Modelo removido");
  revalidatePath("/app/admin/relatorios");
  ok("/app/admin/relatorios");
}

export async function createIncident(formData: FormData) {
  const actor = await requireAdmin();
  const title = field(formData, "title");
  const details = field(formData, "details");
  if (!title || !details) fail("/app/admin/incidentes", "Informe o título e o relato do incidente.");
  const incident = await prisma.incident.create({
    data: { title, details, createdById: actor.id },
  });
  await audit(actor.id, "CREATE_INCIDENT", "Incident", incident.id, title);
  revalidatePath("/app/admin/incidentes");
  revalidatePath("/app");
  ok("/app/admin/incidentes");
}

export async function closeIncident(formData: FormData) {
  const actor = await requireAdmin();
  const id = field(formData, "id");
  await prisma.incident.update({
    where: { id },
    data: { status: "CLOSED", closedAt: new Date(), closedById: actor.id },
  });
  await audit(actor.id, "CLOSE_INCIDENT", "Incident", id, "Incidente encerrado");
  revalidatePath("/app/admin/incidentes");
  revalidatePath("/app");
  ok("/app/admin/incidentes");
}
