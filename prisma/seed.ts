import { addDays, addHours } from "date-fns";
import { PrismaClient } from "@prisma/client";
import { generateDates } from "../src/lib/dates";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

async function main() {
  if (await prisma.person.count()) {
    return;
  }

  const uberlandia = await prisma.city.create({
    data: { name: "Uberlândia", isSeat: true },
  });
  const monteCarmelo = await prisma.city.create({ data: { name: "Monte Carmelo" } });
  const araxa = await prisma.city.create({ data: { name: "Araxá" } });
  const uberaba = await prisma.city.create({ data: { name: "Uberaba" } });

  const central = await prisma.congregation.create({
    data: { name: "CCB Central — Bairro Martins", cityId: uberlandia.id },
  });
  await prisma.congregation.create({
    data: { name: "Comum Monte Carmelo", cityId: monteCarmelo.id },
  });
  await prisma.congregation.create({
    data: { name: "Comum Araxá", cityId: araxa.id },
  });
  await prisma.congregation.create({
    data: { name: "Comum Uberaba", cityId: uberaba.id },
  });

  const sectors = await Promise.all([
    prisma.sector.create({
      data: { code: 1, name: "Sistemas de Ressocialização e Socioeducativos" },
    }),
    prisma.sector.create({
      data: { code: 2, name: "Clínica de Dependentes e Albergues" },
    }),
    prisma.sector.create({
      data: { code: 3, name: "Forças de Segurança" },
    }),
    prisma.sector.create({
      data: { code: 4, name: "Hospitais, Instituição para Idosos, Setor Educacional" },
    }),
  ]);

  const peopleData = [
    {
      name: "Ramires Gomes",
      email: "secretaria@darpe.local",
      phone: "(34) 99999-1001",
      roles: ["SECRETARIO"],
      competencies: [] as string[],
      super: true,
    },
    {
      name: "João Batista",
      email: "anciao@darpe.local",
      phone: "(34) 99999-1002",
      roles: ["ANCIAO_COORDENADOR"],
      competencies: ["ATENDENTE"],
      super: false,
    },
    {
      name: "Maria das Dores",
      email: "encarregada@darpe.local",
      phone: "(34) 99999-1003",
      roles: ["ENCARREGADO_REGIONAL"],
      competencies: ["MUSICO"],
      super: false,
    },
    {
      name: "Pedro Henrique",
      email: "coordenacao@darpe.local",
      phone: "(34) 99999-1004",
      roles: ["COLABORADOR"],
      competencies: ["ATENDENTE"],
      super: false,
    },
    {
      name: "Ana Clara",
      email: "colaboradora@darpe.local",
      phone: "(34) 99999-1005",
      roles: ["COLABORADOR"],
      competencies: ["CANTOR"],
      super: false,
    },
    {
      name: "Lucas Silva",
      email: "menor@darpe.local",
      phone: "(34) 99999-1006",
      roles: ["COLABORADOR"],
      competencies: ["MUSICO"],
      super: false,
      minor: true,
    },
    {
      name: "Helena Souza",
      email: "juridico@darpe.local",
      phone: "(34) 99999-1007",
      roles: ["JURIDICO"],
      competencies: [],
      super: false,
    },
  ];

  const people = [];
  for (const item of peopleData) {
    const person = await prisma.person.create({
      data: {
        name: item.name,
        email: item.email,
        phone: item.phone,
        congregationId: central.id,
        isSuperAdmin: item.super,
        isMinor: Boolean("minor" in item && item.minor),
        consentAt: "minor" in item && item.minor ? new Date() : null,
        birthDate: "minor" in item && item.minor ? new Date("2010-04-12") : new Date("1988-01-01"),
        roles: { create: item.roles.map((role) => ({ role })) },
        competencies: { create: item.competencies.map((competency) => ({ competency })) },
      },
    });
    people.push(person);
  }

  const [ramires, joao, maria, pedro, ana, lucas] = people;

  const hospital = await prisma.institution.create({
    data: {
      name: "Hospital de Clínicas de Uberlândia",
      address: "Av. Pará, 1720 — Umuarama, Uberlândia/MG",
      mapsUrl: "https://maps.google.com/?q=Hospital+de+Clinicas+Uberlandia",
      phone: "(34) 3218-2000",
      capacity: 8,
      notes: "Limite de 8 pessoas por atendimento.",
      cityId: uberlandia.id,
      sectorId: sectors[3].id,
    },
  });
  const presidio = await prisma.institution.create({
    data: {
      name: "Presídio de Uberlândia",
      address: "Rodovia BR-365, Uberlândia/MG",
      capacity: 12,
      requiresRecadastramento: true,
      notes: "Recadastramento anual exigido pela instituição.",
      cityId: uberlandia.id,
      sectorId: sectors[2].id,
    },
  });
  const clinica = await prisma.institution.create({
    data: {
      name: "Comunidade Terapêutica Esperança",
      address: "Rua das Palmeiras, 90 — Uberlândia/MG",
      cityId: uberlandia.id,
      sectorId: sectors[1].id,
    },
  });
  const socio = await prisma.institution.create({
    data: {
      name: "Centro Socioeducativo",
      address: "Av. Rondon Pacheco, 1000 — Uberlândia/MG",
      cityId: uberlandia.id,
      sectorId: sectors[0].id,
    },
  });

  await prisma.institutionResponsible.create({
    data: { institutionId: hospital.id, personId: pedro.id },
  });
  await prisma.institutionResponsible.create({
    data: { institutionId: presidio.id, personId: joao.id },
  });

  const linked = [
    [hospital.id, ramires.id],
    [hospital.id, pedro.id],
    [hospital.id, maria.id],
    [hospital.id, ana.id],
    [hospital.id, lucas.id],
    [presidio.id, joao.id],
    [presidio.id, maria.id],
    [presidio.id, ramires.id],
    [clinica.id, pedro.id],
    [clinica.id, ana.id],
    [socio.id, maria.id],
    [socio.id, lucas.id],
  ] as const;

  for (const [institutionId, personId] of linked) {
    await prisma.institutionLink.create({
      data: {
        institutionId,
        personId,
        createdById: ramires.id,
        endAt: institutionId === presidio.id ? addDays(new Date(), 365) : null,
      },
    });
  }

  const saturday = nextWeekday(6);
  const friday = nextWeekday(5);
  const hospitalSeries = await prisma.recurringSeries.create({
    data: {
      institutionId: hospital.id,
      startDate: saturday,
      intervalDays: 15,
      label: "Sábado a cada 15 dias",
    },
  });
  const hospitalFriday = await prisma.recurringSeries.create({
    data: {
      institutionId: hospital.id,
      startDate: friday,
      intervalDays: 15,
      label: "Sexta a cada 15 dias",
    },
  });
  const prisonSeries = await prisma.recurringSeries.create({
    data: {
      institutionId: presidio.id,
      startDate: saturday,
      intervalDays: 15,
      label: "Sábado a cada 15 dias",
    },
  });

  const horizon = addDays(new Date(), 70);
  for (const series of [hospitalSeries, hospitalFriday, prisonSeries]) {
    for (const date of generateDates(series.startDate, series.intervalDays, horizon)) {
      await prisma.occurrence.create({
        data: { seriesId: series.id, date },
      });
    }
  }

  const nextHospital = await prisma.occurrence.findFirst({
    where: { seriesId: hospitalSeries.id, date: { gte: new Date() } },
    orderBy: { date: "asc" },
  });
  if (nextHospital) {
    for (const personId of [pedro.id, maria.id, ana.id, lucas.id]) {
      await prisma.scaleEntry.create({
        data: { occurrenceId: nextHospital.id, personId },
      });
    }
  }

  const ensaioType = await prisma.eventType.create({
    data: {
      name: "Ensaio musical",
      mandatory: true,
      checklist: JSON.stringify([
        { id: "local", label: "Definir local", required: true },
        { id: "som", label: "Testar itens de informática / som", required: true },
        { id: "porteiro", label: "Escalar porteiros", required: false },
      ]),
    },
  });
  await prisma.eventType.create({
    data: {
      name: "Reunião do Darpe",
      mandatory: true,
      checklist: JSON.stringify([
        { id: "local", label: "Definir local", required: true },
        { id: "alimentacao", label: "Organizar alimentação", required: true },
        { id: "som", label: "Testar som e projeção", required: true },
        { id: "porteiro", label: "Escalar porteiros", required: false },
      ]),
    },
  });
  await prisma.eventType.create({
    data: {
      name: "Batismo",
      mandatory: false,
      checklist: JSON.stringify([{ id: "anciao", label: "Confirmar ancião presidente", required: true }]),
    },
  });

  const ensaioStart = addHours(addDays(saturday, 7), 19);
  await prisma.regionalEvent.create({
    data: {
      typeId: ensaioType.id,
      title: "Ensaio musical da regional",
      startsAt: ensaioStart,
      endsAt: addHours(ensaioStart, 2),
      location: "CCB Central — Bairro Martins",
      mandatory: true,
      checkinToken: randomBytes(12).toString("hex"),
      createdById: ramires.id,
      checklistJson: ensaioType.checklist,
    },
  });

  const notification = await prisma.notification.create({
    data: {
      title: "Bem-vindos ao DRP",
      body: "Este é o sistema da Regional Uberlândia. Confira sua agenda e confirme ciência desta mensagem.",
      audience: "todos",
      kind: "MANDATORY",
      requiresAck: true,
    },
  });
  for (const person of people) {
    await prisma.notificationReceipt.create({
      data: { notificationId: notification.id, personId: person.id },
    });
  }

  console.log("Seed concluído. Acessos de demonstração:");
  for (const person of people) {
    console.log(`  ${person.email} — ${person.name}`);
  }
}

function nextWeekday(weekday: number) {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  const delta = (weekday + 7 - date.getDay()) % 7 || 7;
  return addDays(date, delta);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
