import { isAdmin } from "@/lib/permissions";
import { getCurrentPerson } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatDay } from "@/lib/dates";
import { occurrenceReportWhere } from "@/lib/reports";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const person = await getCurrentPerson();
  if (!person || !isAdmin(person)) {
    return new Response("Acesso restrito à secretaria.", { status: 403 });
  }

  const setor = request.nextUrl.searchParams.get("setor") ?? "";
  const cidade = request.nextUrl.searchParams.get("cidade") ?? "";
  const situacao = request.nextUrl.searchParams.get("situacao") ?? "";

  const occurrences = await prisma.occurrence.findMany({
    where: occurrenceReportWhere({ setor, cidade, situacao }),
    include: {
      series: { include: { institution: { include: { city: true, sector: true } } } },
      participations: true,
    },
    orderBy: { date: "desc" },
    take: 500,
  });

  const header = ["Data", "Instituicao", "Cidade", "Setor", "Situacao", "Presentes", "Faltas", "Justificados"];
  const rows = occurrences.map((item) => [
    formatDay(item.date),
    item.series.institution.name,
    item.series.institution.city.name,
    String(item.series.institution.sector.code),
    item.cancelled ? "Cancelado" : item.closedAt ? "Realizado" : "Previsto",
    String(item.participations.filter((row) => row.state === "PRESENTE").length),
    String(item.participations.filter((row) => row.state === "AUSENTE").length),
    String(item.participations.filter((row) => row.state === "JUSTIFICADO").length),
  ]);
  const csv = [header, ...rows]
    .map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";"))
    .join("\n");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="relatorio-darpe.csv"',
    },
  });
}
