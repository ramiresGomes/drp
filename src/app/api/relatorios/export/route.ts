import { isAdmin } from "@/lib/permissions";
import { getCurrentPerson } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatDay, formatDateTime } from "@/lib/dates";
import { csvLine, isAnonymized, occurrenceReportWhere, type ReportFilters } from "@/lib/reports";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const person = await getCurrentPerson();
  if (!person || !isAdmin(person)) {
    return new Response("Acesso restrito à secretaria.", { status: 403 });
  }

  const params: ReportFilters = {
    setor: request.nextUrl.searchParams.get("setor") ?? "",
    cidade: request.nextUrl.searchParams.get("cidade") ?? "",
    situacao: request.nextUrl.searchParams.get("situacao") ?? "",
    fato: request.nextUrl.searchParams.get("fato") ?? "atendimentos",
    anonimizado: request.nextUrl.searchParams.get("anonimizado"),
  };
  const fato = params.fato || "atendimentos";
  const anonymized = isAnonymized(params);

  let header: string[] = [];
  let rows: Array<Array<string | number>> = [];

  if (fato === "eventos") {
    const events = await prisma.regionalEvent.findMany({
      include: { type: true, attendances: { include: { person: true } } },
      orderBy: { startsAt: "desc" },
      take: 500,
    });
    header = anonymized
      ? ["Evento", "Tipo", "Inicio", "Presencas"]
      : ["Evento", "Tipo", "Inicio", "Presencas", "Pessoas"];
    rows = events.map((event) => {
      const base: Array<string | number> = [
        event.title,
        event.type.name,
        formatDateTime(event.startsAt),
        event.attendances.length,
      ];
      if (!anonymized) {
        base.push(event.attendances.map((row) => row.person.name).join("; ") || "—");
      }
      return base;
    });
  } else if (fato === "batismos") {
    const baptisms = await prisma.baptism.findMany({
      include: { event: true },
      orderBy: { event: { startsAt: "desc" } },
      take: 500,
    });
    if (anonymized) {
      header = ["Evento", "Data", "Registros"];
      const grouped = new Map<string, { title: string; startsAt: Date; count: number }>();
      for (const item of baptisms) {
        const current = grouped.get(item.eventId);
        if (current) current.count += 1;
        else grouped.set(item.eventId, { title: item.event.title, startsAt: item.event.startsAt, count: 1 });
      }
      rows = [...grouped.values()].map((item) => [item.title, formatDateTime(item.startsAt), item.count]);
    } else {
      header = ["Evento", "Data", "Batizando"];
      rows = baptisms.map((item) => [item.event.title, formatDateTime(item.event.startsAt), item.fullName]);
    }
  } else {
    const occurrences = await prisma.occurrence.findMany({
      where: occurrenceReportWhere(params),
      include: {
        series: { include: { institution: { include: { city: true, sector: true } } } },
        participations: { include: { person: true } },
      },
      orderBy: { date: "desc" },
      take: 500,
    });
    header = ["Data", "Instituicao", "Cidade", "Setor", "Situacao", "Presentes", "Faltas", "Justificados"];
    if (!anonymized) header.push("Pessoas");
    rows = occurrences.map((item) => {
      const line: Array<string | number> = [
        formatDay(item.date),
        item.series.institution.name,
        item.series.institution.city.name,
        String(item.series.institution.sector.code),
        item.cancelled ? "Cancelado" : item.closedAt ? "Realizado" : "Previsto",
        item.participations.filter((row) => row.state === "PRESENTE").length,
        item.participations.filter((row) => row.state === "AUSENTE").length,
        item.participations.filter((row) => row.state === "JUSTIFICADO").length,
      ];
      if (!anonymized) {
        line.push(item.participations.map((row) => `${row.person.name} (${row.state})`).join("; ") || "—");
      }
      return line;
    });
  }

  const csv = [header, ...rows].map((line) => csvLine(line)).join("\n");
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio-darpe-${fato}.csv"`,
    },
  });
}
