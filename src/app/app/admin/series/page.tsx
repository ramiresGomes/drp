import { createSeries } from "@/app/actions/admin";
import { AdminNav } from "@/components/admin-nav";
import { EmptyState, Flash } from "@/components/flash";
import { controlClass, Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { WEEKDAYS } from "@/lib/labels";
import { requireAdmin } from "@/lib/session";
import { formatDay } from "@/lib/dates";

export default async function SeriesPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const [series, institutions] = await Promise.all([
    prisma.recurringSeries.findMany({
      include: { institution: true, occurrences: { orderBy: { date: "asc" }, take: 3, where: { date: { gte: new Date() }, cancelled: false } } },
      orderBy: { startDate: "asc" },
    }),
    prisma.institution.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <AdminNav current="/app/admin/series" />
      <h1 className="mb-2 font-heading text-3xl">Séries de atendimento</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        A recorrência parte de uma data escolhida, por exemplo sábado a cada 15 dias. O sistema gera ocorrências com
        pelo menos 70 dias de antecedência. Não há remarcação: cancela-se com justificativa.
      </p>
      <Flash erro={params.erro} ok={params.ok} />

      <Card className="mb-8 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Nova série</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSeries} className="grid gap-3 md:grid-cols-2">
            <Field label="Instituição">
              <select className={controlClass} name="institutionId" required>
                {institutions.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Dia da semana de referência">
              <select className={controlClass} name="weekday" defaultValue="6">
                {WEEKDAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Primeira data (opcional)">
              <input className={controlClass} type="date" name="startDate" />
            </Field>
            <Field label="Intervalo em dias">
              <input className={controlClass} type="number" name="intervalDays" defaultValue={15} min={1} />
            </Field>
            <Field label="Prazo da justificativa (dias antes)">
              <input className={controlClass} type="number" name="justifyDaysBefore" defaultValue={2} min={0} />
            </Field>
            <div className="flex items-end">
              <Button type="submit">Gerar série e ocorrências</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {series.length === 0 ? (
        <EmptyState title="Nenhuma série" description="Crie a recorrência do primeiro atendimento." />
      ) : (
        <div className="grid gap-3">
          {series.map((item) => (
            <div key={item.id} className="rounded-xl border border-border p-4">
              <p className="font-medium">
                {item.institution.name} · {item.label}
              </p>
              <p className="text-sm text-muted-foreground">
                Início {formatDay(item.startDate)} · justificativa até {item.justifyDaysBefore} dia(s) antes
              </p>
              <p className="mt-2 text-sm">
                Próximas:{" "}
                {item.occurrences.length === 0
                  ? "sem datas futuras"
                  : item.occurrences.map((occurrence) => formatDay(occurrence.date)).join(" · ")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
