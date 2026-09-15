import { AdminNav } from "@/components/admin-nav";
import { EmptyState } from "@/components/flash";
import { controlClass, Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { occurrenceReportWhere } from "@/lib/reports";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatDay } from "@/lib/dates";
import Link from "next/link";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ setor?: string; cidade?: string; situacao?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const [sectors, cities] = await Promise.all([
    prisma.sector.findMany({ orderBy: { code: "asc" } }),
    prisma.city.findMany({ orderBy: { name: "asc" } }),
  ]);

  const occurrences = await prisma.occurrence.findMany({
    where: occurrenceReportWhere(params),
    include: {
      series: { include: { institution: { include: { city: true, sector: true } } } },
      participations: true,
    },
    orderBy: { date: "desc" },
    take: 120,
  });

  const exportQuery = new URLSearchParams();
  if (params.setor) exportQuery.set("setor", params.setor);
  if (params.cidade) exportQuery.set("cidade", params.cidade);
  if (params.situacao) exportQuery.set("situacao", params.situacao);
  const exportHref = `/api/relatorios/export${exportQuery.size ? `?${exportQuery.toString()}` : ""}`;

  return (
    <div>
      <AdminNav current="/app/admin/relatorios" />
      <h1 className="mb-2 font-heading text-3xl">Relatórios</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Construtor controlado da v1: fato de atendimento com recorte por setor, cidade e situação. Cancelado permanece
        cancelado. Extra conta como presença nas métricas de atuação.
      </p>

      <form method="get" className="mb-6 grid gap-3 rounded-xl border border-border p-4 md:grid-cols-4">
        <Field label="Setor">
          <select className={controlClass} name="setor" defaultValue={params.setor ?? ""}>
            <option value="">Todos</option>
            {sectors.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.code}. {sector.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cidade">
          <select className={controlClass} name="cidade" defaultValue={params.cidade ?? ""}>
            <option value="">Todas</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Situação">
          <select className={controlClass} name="situacao" defaultValue={params.situacao ?? ""}>
            <option value="">Todas</option>
            <option value="previsto">Previsto</option>
            <option value="realizado">Realizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </Field>
        <div className="flex items-end gap-2">
          <Button type="submit" variant="outline">
            Filtrar
          </Button>
          <Button render={<Link href={exportHref} />} variant="secondary">
            Exportar CSV
          </Button>
        </div>
      </form>

      {occurrences.length === 0 ? (
        <EmptyState title="Sem ocorrências" description="Ajuste os filtros ou gere séries para acompanhar os números." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Data</th>
                <th className="px-3 py-2 font-medium">Instituição</th>
                <th className="px-3 py-2 font-medium">Cidade</th>
                <th className="px-3 py-2 font-medium">Setor</th>
                <th className="px-3 py-2 font-medium">Situação</th>
                <th className="px-3 py-2 font-medium">Presentes</th>
                <th className="px-3 py-2 font-medium">Faltas</th>
                <th className="px-3 py-2 font-medium">Justificados</th>
              </tr>
            </thead>
            <tbody>
              {occurrences.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-3 py-2">{formatDay(item.date)}</td>
                  <td className="px-3 py-2">{item.series.institution.name}</td>
                  <td className="px-3 py-2">{item.series.institution.city.name}</td>
                  <td className="px-3 py-2">{item.series.institution.sector.code}</td>
                  <td className="px-3 py-2">
                    {item.cancelled ? "Cancelado" : item.closedAt ? "Realizado" : "Previsto"}
                  </td>
                  <td className="px-3 py-2">{item.participations.filter((row) => row.state === "PRESENTE").length}</td>
                  <td className="px-3 py-2">{item.participations.filter((row) => row.state === "AUSENTE").length}</td>
                  <td className="px-3 py-2">{item.participations.filter((row) => row.state === "JUSTIFICADO").length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
