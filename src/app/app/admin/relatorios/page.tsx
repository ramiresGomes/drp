import { AdminNav } from "@/components/admin-nav";
import { EmptyState } from "@/components/flash";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatDay } from "@/lib/dates";

export default async function ReportsPage() {
  await requireAdmin();
  const occurrences = await prisma.occurrence.findMany({
    include: {
      series: { include: { institution: { include: { city: true, sector: true } } } },
      participations: true,
    },
    orderBy: { date: "desc" },
    take: 60,
  });

  return (
    <div>
      <AdminNav current="/app/admin/relatorios" />
      <h1 className="mb-2 font-heading text-3xl">Relatórios</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Construtor controlado da v1: atendimento previsto, realizado ou cancelado, com presença, falta e justificativa.
        Atendimento cancelado permanece cancelado nas métricas.
      </p>
      {occurrences.length === 0 ? (
        <EmptyState title="Sem ocorrências" description="Gere séries para acompanhar os números." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Data</th>
                <th className="px-3 py-2 font-medium">Instituição</th>
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
