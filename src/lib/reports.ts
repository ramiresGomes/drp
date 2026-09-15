export type ReportFilters = {
  setor?: string | null;
  cidade?: string | null;
  situacao?: string | null;
  fato?: string | null;
  anonimizado?: string | null;
};

export function occurrenceReportWhere(params: ReportFilters) {
  return {
    ...(params.setor ? { series: { institution: { sectorId: params.setor } } } : {}),
    ...(params.cidade ? { series: { institution: { cityId: params.cidade } } } : {}),
    ...(params.situacao === "cancelado" ? { cancelled: true } : {}),
    ...(params.situacao === "realizado" ? { cancelled: false, closedAt: { not: null } } : {}),
    ...(params.situacao === "previsto" ? { cancelled: false, closedAt: null } : {}),
  };
}

export function reportQuery(params: ReportFilters) {
  const query = new URLSearchParams();
  if (params.setor) query.set("setor", params.setor);
  if (params.cidade) query.set("cidade", params.cidade);
  if (params.situacao) query.set("situacao", params.situacao);
  if (params.fato && params.fato !== "atendimentos") query.set("fato", params.fato);
  if (params.anonimizado === "0") query.set("anonimizado", "0");
  return query;
}

export function isAnonymized(params: ReportFilters) {
  return params.anonimizado !== "0";
}

export function csvLine(cells: Array<string | number>) {
  return cells.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";");
}

export type ReportTable = {
  title: string;
  fato: string;
  anonymized: boolean;
  header: string[];
  rows: Array<Array<string | number>>;
};

export async function loadReportTable(params: ReportFilters): Promise<ReportTable> {
  const { prisma } = await import("@/lib/db");
  const { formatDay, formatDateTime } = await import("@/lib/dates");
  const fato = params.fato || "atendimentos";
  const anonymized = isAnonymized(params);

  if (fato === "eventos") {
    const events = await prisma.regionalEvent.findMany({
      include: { type: true, attendances: { include: { person: true } } },
      orderBy: { startsAt: "desc" },
      take: 500,
    });
    const header = anonymized
      ? ["Evento", "Tipo", "Início", "Presenças"]
      : ["Evento", "Tipo", "Início", "Presenças", "Pessoas"];
    const rows = events.map((event) => {
      const line: Array<string | number> = [
        event.title,
        event.type.name,
        formatDateTime(event.startsAt),
        event.attendances.length,
      ];
      if (!anonymized) line.push(event.attendances.map((row) => row.person.name).join("; ") || "—");
      return line;
    });
    return { title: "Eventos obrigatórios", fato, anonymized, header, rows };
  }

  if (fato === "batismos") {
    const baptisms = await prisma.baptism.findMany({
      include: { event: true },
      orderBy: { event: { startsAt: "desc" } },
      take: 500,
    });
    if (anonymized) {
      const grouped = new Map<string, { title: string; startsAt: Date; count: number }>();
      for (const item of baptisms) {
        const current = grouped.get(item.eventId);
        if (current) current.count += 1;
        else grouped.set(item.eventId, { title: item.event.title, startsAt: item.event.startsAt, count: 1 });
      }
      return {
        title: "Batismos registrados",
        fato,
        anonymized,
        header: ["Evento", "Data", "Registros"],
        rows: [...grouped.values()].map((item) => [item.title, formatDateTime(item.startsAt), item.count]),
      };
    }
    return {
      title: "Batismos registrados",
      fato,
      anonymized,
      header: ["Evento", "Data", "Batizando"],
      rows: baptisms.map((item) => [item.event.title, formatDateTime(item.event.startsAt), item.fullName]),
    };
  }

  const occurrences = await prisma.occurrence.findMany({
    where: occurrenceReportWhere(params),
    include: {
      series: { include: { institution: { include: { city: true, sector: true } } } },
      participations: { include: { person: true } },
    },
    orderBy: { date: "desc" },
    take: 500,
  });
  const header = ["Data", "Instituição", "Cidade", "Setor", "Situação", "Presentes", "Extras", "Faltas", "Justificados"];
  if (!anonymized) header.push("Pessoas");
  const rows = occurrences.map((item) => {
    const line: Array<string | number> = [
      formatDay(item.date),
      item.series.institution.name,
      item.series.institution.city.name,
      String(item.series.institution.sector.code),
      item.cancelled ? "Cancelado" : item.closedAt ? "Realizado" : "Previsto",
      item.participations.filter((row) => row.state === "PRESENTE" && !row.extra).length,
      item.participations.filter((row) => row.state === "PRESENTE" && row.extra).length,
      item.participations.filter((row) => row.state === "AUSENTE").length,
      item.participations.filter((row) => row.state === "JUSTIFICADO").length,
    ];
    if (!anonymized) {
      line.push(item.participations.map((row) => `${row.person.name} (${row.state}${row.extra ? " extra" : ""})`).join("; ") || "—");
    }
    return line;
  });
  return { title: "Participações em atendimento", fato, anonymized, header, rows };
}
