import { auth } from "@/auth";
import { canUseCoordinatorPanel, isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { requirePerson } from "@/lib/session";
import { formatDay, formatDateTime } from "@/lib/dates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { startOfMonth, endOfMonth, addDays } from "date-fns";

export default async function AppHomePage() {
  const person = await requirePerson();
  const session = await auth();
  const from = startOfMonth(new Date());
  const to = endOfMonth(addDays(new Date(), 40));

  const [occurrences, events, pendingApprovals, unread] = await Promise.all([
    prisma.occurrence.findMany({
      where: { date: { gte: from, lte: to } },
      include: { series: { include: { institution: true } }, participations: true, scale: true },
    }),
    prisma.regionalEvent.findMany({
      where: { startsAt: { gte: from } },
      orderBy: { startsAt: "asc" },
      take: 6,
    }),
    isAdmin(person)
      ? prisma.dualApproval.count({ where: { status: "PENDING" } })
      : Promise.resolve(0),
    prisma.notificationReceipt.count({
      where: { personId: person.id, readAt: null },
    }),
  ]);

  const previstos = occurrences.filter((item) => !item.cancelled && !item.closedAt).length;
  const realizados = occurrences.filter((item) => item.closedAt).length;
  const cancelados = occurrences.filter((item) => item.cancelled).length;
  const presentes = occurrences.flatMap((item) => item.participations).filter((item) => item.state === "PRESENTE").length;
  const ausentes = occurrences.flatMap((item) => item.participations).filter((item) => item.state === "AUSENTE").length;
  const justificadas = occurrences.flatMap((item) => item.participations).filter((item) => item.state === "JUSTIFICADO").length;
  const todayOpen = occurrences.filter(
    (item) => !item.cancelled && !item.closedAt && formatDay(item.date) === formatDay(new Date()),
  );

  return (
    <div>
      <header className="mb-8">
        <p className="text-xs tracking-[0.2em] text-primary uppercase">Painel</p>
        <h1 className="mt-2 font-heading text-4xl">Olá, {person.name.split(" ")[0]}.</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Sistema do Darpe da Regional Uberlândia. Entrada com {session?.user?.email}. Presença de atendimento fecha no
          mesmo dia; eventos obrigatórios valem para toda a regional.
        </p>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Previstos" value={previstos} hint="Atendimentos ainda abertos no período" />
        <Metric title="Realizados" value={realizados} hint="Listas fechadas" />
        <Metric title="Cancelados" value={cancelados} hint="Permanecem cancelados nas métricas" />
        <Metric
          title="Presença"
          value={presentes + ausentes + justificadas === 0 ? "—" : `${presentes}`}
          hint={`${ausentes} faltas · ${justificadas} justificadas`}
        />
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Pendências</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{unread} aviso(s) sem leitura.</p>
            {isAdmin(person) ? <p>{pendingApprovals} pedido(s) de dupla aprovação.</p> : null}
            <p>{todayOpen.length} atendimento(s) de hoje ainda sem lista fechada.</p>
            {unread === 0 && pendingApprovals === 0 && todayOpen.length === 0 ? (
              <p>Nada pendente neste momento.</p>
            ) : null}
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Atalhos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button render={<Link href="/app/agenda" />} variant="outline">
              Ver agenda
            </Button>
            {canUseCoordinatorPanel(person) ? (
              <Button render={<Link href="/app/coordenacao" />} variant="outline">
                Coordenar atendimentos
              </Button>
            ) : null}
            {isAdmin(person) ? (
              <Button render={<Link href="/app/admin/pessoas" />} variant="outline">
                Abrir secretaria
              </Button>
            ) : null}
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Próximos eventos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {events.length === 0 ? (
              <p className="text-muted-foreground">Nenhum evento regional marcado.</p>
            ) : (
              events.map((event) => (
                <div key={event.id}>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-muted-foreground">
                    {formatDateTime(event.startsAt)} · {event.location}
                    {event.mandatory ? " · obrigatório" : ""}
                    {event.cancelled ? " · cancelado" : ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Metric({ title, value, hint }: { title: string; value: number | string; hint: string }) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-3xl">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
