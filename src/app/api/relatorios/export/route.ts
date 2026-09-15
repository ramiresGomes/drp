import { isAdmin } from "@/lib/permissions";
import { getCurrentPerson } from "@/lib/session";
import { csvLine, loadReportTable, type ReportFilters } from "@/lib/reports";
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
  const table = await loadReportTable(params);
  const csv = [table.header, ...table.rows].map((line) => csvLine(line)).join("\n");
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio-darpe-${table.fato}.csv"`,
    },
  });
}
