import { deleteReportTemplate, saveReportTemplate } from "@/app/actions/admin";
import { AdminNav } from "@/components/admin-nav";
import { EmptyState } from "@/components/flash";
import { controlClass, Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { occurrenceReportWhere, reportQuery, isAnonymized, type ReportFilters } from "@/lib/reports";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatDay, formatDateTime } from "@/lib/dates";
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
  const [sectors, cities, templates] = await Promise.all([
    prisma.sector.findMany({ orderBy: { code: "asc" } }),
    prisma.city.findMany({ orderBy: { name: "asc" } }),
    prisma.reportTemplate.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const occurrences =
    fato === "atendimentos"
      ? await prisma.occurrence.findMany({
          where: occurrenceReportWhere(params),
          include: {
            series: { include: { institution: { include: { city: true, sector: true } } } },
            participations: { include: { person: true } },
          },
          orderBy: { date: "desc" },
          take: 120,
        })
      : [];
  const events =
    fato === "eventos"
      ? await prisma.regionalEvent.findMany({
          include: { type: true, attendances: true },
          orderBy: { startsAt: "desc" },
          take: 80,
        })
      : [];
  const baptisms =
    fato === "batismos"
      ? await prisma.baptism.findMany({
          include: { event: true },
          orderBy: { event: { startsAt: "desc" } },
          take: 80,
        })
      : [];

  const query = reportQuery({ ...params, fato, anonimizado: anonymized ? "1" : "0" });
  const exportHref = `/api/relatorios/export${query.size ? `?${query.toString()}` : ""}`;

  return (
    <div>
      <AdminNav current="/app/admin/relatorios" />
      <h1 className="mb-2 font-heading text-3xl">Relatórios</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Construtor controlado: escolha o fato, o recorte e se o relatório amplo permanece anonimizado. Identificação
        individual só com recorte explícito da secretaria.
      </p>

      <form method="get" className="mb-4 grid gap-3 rounded-xl border border-border p-4 md:grid-cols-5">
        <Field label="Fato">
          <select className={controlClass} name="fato" defaultValue={fato}>
            <option value="atendimentos">Participações em atendimento</option>
            <option value="eventos">Eventos obrigatórios</option>
            <option value="batismos">Batismos registrados</option>
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
        <div className="flex items-end gap-2 md:col-span-5">
          <Button type="submit" variant="outline">
            Filtrar
          </Button>
          <Button render={<Link href={exportHref} />} variant="secondary">
            Exportar CSV
          </Button>
        </div>
      </form>

      <form action={saveReportTemplate} className="mb-8 flex flex-wrap items-end gap-2">
        <input type="hidden" name="setor" value={params.setor ?? ""} />
        <input type="hidden" name="cidade" value={params.cidade ?? ""} />
        <input type="hidden" name="situacao" value={params.situacao ?? ""} />
        <input type="hidden" name="fato" value={fato} />
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

      {fato === "atendimentos" && occurrences.length === 0 ? (
        <EmptyState title="Sem ocorrências" description="Ajuste os filtros ou gere séries para acompanhar os números." />
      ) : null}
      {fato === "atendimentos" && occurrences.length > 0 ? (
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
                {!anonymized ? <th className="px-3 py-2 font-medium">Pessoas</th> : null}
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
                  {!anonymized ? (
                    <td className="px-3 py-2 text-xs">
                      {item.participations.map((row) => `${row.person.name} (${row.state})`).join("; ") || "—"}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {fato === "eventos" ? (
        events.length === 0 ? (
          <EmptyState title="Sem eventos" description="Publique um evento regional para ver a participação." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Evento</th>
                  <th className="px-3 py-2 font-medium">Tipo</th>
                  <th className="px-3 py-2 font-medium">Início</th>
                  <th className="px-3 py-2 font-medium">Presenças</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-t border-border">
                    <td className="px-3 py-2">{event.title}</td>
                    <td className="px-3 py-2">{event.type.name}</td>
                    <td className="px-3 py-2">{formatDateTime(event.startsAt)}</td>
                    <td className="px-3 py-2">{event.attendances.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}

      {fato === "batismos" ? (
        baptisms.length === 0 ? (
          <EmptyState title="Sem batismos" description="Os nomes lançados nos eventos de batismo aparecem aqui." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Evento</th>
                  <th className="px-3 py-2 font-medium">Data</th>
                  <th className="px-3 py-2 font-medium">{anonymized ? "Registros" : "Batizando"}</th>
                </tr>
              </thead>
              <tbody>
                {anonymized ? (
                  Object.entries(
                    baptisms.reduce<Record<string, number>>((acc, item) => {
                      acc[item.eventId] = (acc[item.eventId] ?? 0) + 1;
                      return acc;
                    }, {}),
                  ).map(([eventId, count]) => {
                    const event = baptisms.find((item) => item.eventId === eventId)?.event;
                    return (
                      <tr key={eventId} className="border-t border-border">
                        <td className="px-3 py-2">{event?.title}</td>
                        <td className="px-3 py-2">{event ? formatDateTime(event.startsAt) : "—"}</td>
                        <td className="px-3 py-2">{count}</td>
                      </tr>
                    );
                  })
                ) : (
                  baptisms.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-3 py-2">{item.event.title}</td>
                      <td className="px-3 py-2">{formatDateTime(item.event.startsAt)}</td>
                      <td className="px-3 py-2">{item.fullName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </div>
  );
}
