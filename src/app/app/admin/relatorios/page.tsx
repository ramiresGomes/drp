import { deleteReportTemplate, saveReportTemplate } from "@/app/actions/admin";
import { AdminNav } from "@/components/admin-nav";
import { EmptyState } from "@/components/flash";
import { controlClass, Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { loadReportTable, reportQuery, isAnonymized, type ReportFilters } from "@/lib/reports";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PERIOD_KEYS, PERIOD_LABELS } from "@/lib/period";
import Link from "next/link";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<ReportFilters>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const fato = params.fato || "atendimentos";
  const anonymized = isAnonymized(params);
  const periodo = params.periodo || "";
  const [sectors, cities, templates, table] = await Promise.all([
    prisma.sector.findMany({ orderBy: { code: "asc" } }),
    prisma.city.findMany({ orderBy: { name: "asc" } }),
    prisma.reportTemplate.findMany({ orderBy: { createdAt: "desc" } }),
    loadReportTable({ ...params, fato, periodo, anonimizado: anonymized ? "1" : "0" }),
  ]);

  const query = reportQuery({ ...params, fato, periodo, anonimizado: anonymized ? "1" : "0" });
  const exportHref = `/api/relatorios/export${query.size ? `?${query.toString()}` : ""}`;
  const pdfHref = `/relatorio-pdf${query.size ? `?${query.toString()}` : ""}`;

  return (
    <div>
      <AdminNav current="/app/admin/relatorios" />
      <h1 className="mb-2 font-heading text-3xl">Relatórios</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Construtor controlado: escolha o fato, o recorte temporal e se o relatório amplo permanece anonimizado.
        Identificação individual só com recorte explícito da secretaria.
      </p>

      <form method="get" className="mb-4 grid gap-3 rounded-xl border border-border p-4 md:grid-cols-6">
        <Field label="Fato">
          <select className={controlClass} name="fato" defaultValue={fato}>
            <option value="atendimentos">Participações em atendimento</option>
            <option value="faltas">Faltas e faltas justificadas</option>
            <option value="eventos">Eventos obrigatórios</option>
            <option value="batismos">Batismos registrados</option>
            <option value="crescimento">Crescimento</option>
          </select>
        </Field>
        <Field label="Período">
          <select className={controlClass} name="periodo" defaultValue={periodo}>
            <option value="">Todo o histórico</option>
            {PERIOD_KEYS.map((key) => (
              <option key={key} value={key}>
                {PERIOD_LABELS[key]}
              </option>
            ))}
          </select>
        </Field>
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
        <label className="flex items-end gap-2 text-sm">
          <input type="checkbox" name="anonimizado" value="0" defaultChecked={!anonymized} />
          Identificar pessoas
        </label>
        <div className="flex items-end gap-2 md:col-span-6">
          <Button type="submit" variant="outline">
            Filtrar
          </Button>
          <Button render={<Link href={exportHref} />} variant="secondary">
            Exportar CSV
          </Button>
          <Button render={<Link href={pdfHref} />} variant="outline">
            Exportar PDF
          </Button>
        </div>
      </form>

      <form action={saveReportTemplate} className="mb-8 flex flex-wrap items-end gap-2">
        <input type="hidden" name="setor" value={params.setor ?? ""} />
        <input type="hidden" name="cidade" value={params.cidade ?? ""} />
        <input type="hidden" name="situacao" value={params.situacao ?? ""} />
        <input type="hidden" name="fato" value={fato} />
        <input type="hidden" name="periodo" value={periodo} />
        <input type="hidden" name="anonimizado" value={anonymized ? "1" : "0"} />
        <Field label="Salvar modelo">
          <input className={controlClass} name="name" placeholder="Nome do modelo" required />
        </Field>
        <Button type="submit" variant="outline">
          Guardar recorte
        </Button>
      </form>

      {templates.length > 0 ? (
        <div className="mb-8 grid gap-2">
          <p className="text-sm font-medium">Modelos da secretaria</p>
          {templates.map((template) => {
            const filters = JSON.parse(template.filtersJson) as ReportFilters;
            const href = `/app/admin/relatorios?${reportQuery(filters).toString()}`;
            return (
              <div key={template.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <Link href={href} className="hover:underline">
                  {template.name}
                </Link>
                <form action={deleteReportTemplate}>
                  <input type="hidden" name="id" value={template.id} />
                  <Button type="submit" size="sm" variant="ghost">
                    Remover
                  </Button>
                </form>
              </div>
            );
          })}
        </div>
      ) : null}

      {table.rows.length === 0 ? (
        <EmptyState title="Sem registros" description="Ajuste os filtros ou gere séries para acompanhar os números." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                {table.header.map((cell) => (
                  <th key={cell} className="px-3 py-2 font-medium">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, index) => (
                <tr key={index} className="border-t border-border">
                  {row.map((cell, cellIndex) => (
                    <td key={`${index}-${cellIndex}`} className="px-3 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
