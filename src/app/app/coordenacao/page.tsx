import Link from "next/link";
import { EmptyState } from "@/components/flash";
import { prisma } from "@/lib/db";
import { canScale } from "@/lib/permissions";
import { requireCoordinator } from "@/lib/session";
import { formatDay } from "@/lib/dates";

export default async function CoordinationIndexPage() {
  const person = await requireCoordinator();
  const institutions = await prisma.institution.findMany({
    where: { active: true },
    include: {
      city: true,
      sector: true,
      series: {
        include: {
          occurrences: {
            where: { date: { gte: new Date() }, cancelled: false },
            orderBy: { date: "asc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
  const visible = institutions.filter((institution) => canScale(person, institution.id));

  return (
    <div>
      <h1 className="mb-2 font-heading text-3xl">Coordenação</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Escala só quem tem vínculo ativo. Presença fecha no mesmo dia. Não há pedido de substituição: o coordenador
        troca a pessoa na escala.
      </p>
      {visible.length === 0 ? (
        <EmptyState
          title="Nenhuma instituição sob sua responsabilidade"
          description="A secretaria define os responsáveis de cada local."
        />
      ) : (
        <div className="grid gap-3">
          {visible.map((institution) => {
            const next = institution.series.flatMap((item) => item.occurrences)[0];
            return (
              <Link
                key={institution.id}
                href={`/app/coordenacao/${institution.id}`}
                className="rounded-xl border border-border p-4 hover:bg-muted/40"
              >
                <p className="font-medium">{institution.name}</p>
                <p className="text-sm text-muted-foreground">
                  {institution.city.name} · setor {institution.sector.code}
                  {next ? ` · próximo ${formatDay(next.date)}` : " · sem data futura"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
