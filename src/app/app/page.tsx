import { auth } from "@/auth";
import { canUseCoordinatorPanel, isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { requirePerson } from "@/lib/session";
import { getDashboardMetrics, getOperationalPendencies } from "@/lib/operations";
import { formatDay, formatDateTime } from "@/lib/dates";
import { PERIOD_KEYS, PERIOD_LABELS, parsePeriod } from "@/lib/period";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/field";
import Link from "next/link";
import { startOfDay, addDays } from "date-fns";

export default async function AppHomePage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const person = await requirePerson();
  const session = await auth();
  const params = await searchParams;
  const periodo = parsePeriod(params.periodo);
  const metrics = await getDashboardMetrics(periodo);

  const [events, pendingApprovals, unread, pendencies] = await Promise.all([
    prisma.regionalEvent.findMany({
      where: { startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 6,
    }),
    isAdmin(person)
      ? prisma.dualApproval.count({ where: { status: "PENDING" } })
      : Promise.resolve(0),
    prisma.notificationReceipt.count({
      where: {
        personId: person.id,
        readAt: null,
        notification: {
          AND: [
            { OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }] },
            ...(person.muteOptionalNotifications ? [{ kind: { not: "INFO" } }] : []),
          ],
        },
      },
    }),
    isAdmin(person) ? getOperationalPendencies() : Promise.resolve(null),
  ]);

  const dayStart = startOfDay(new Date());
  const todayOpen = await prisma.occurrence.count({
    where: {
      cancelled: false,
      closedAt: null,
      date: { gte: dayStart, lt: addDays(dayStart, 1) },
    },
  });

  return (
    <div>
      <header className="mb-8">
        <p className="text-xs tracking-[0.2em] text-primary uppercase">Painel</p>
        <h1 className="mt-2 font-heading text-4xl">Olá, {person.name.split(" ")[0]}.</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Sistema do Darpe da Regional Uberlândia. Entrada com {session?.user?.email}. Presença de atendimento fecha no
          mesmo dia; eventos obrigatórios valem para toda a regional.
        </p>
        <form method="get" className="mt-4 flex max-w-xs items-end gap-2">
          <label className="grid flex-1 gap-1 text-sm">
            <span className="font-medium">Período</span>
            <select className={controlClass} name="periodo" defaultValue={periodo}>
              {PERIOD_KEYS.map((key) => (
                <option key={key} value={key}>
                  {PERIOD_LABELS[key]}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="outline">
            Ver
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          Recorte {formatDay(metrics.range.start)} — {formatDay(metrics.range.end)}
        </p>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Previstos" value={metrics.previstos} hint="Atendimentos ainda abertos no período" />
        <Metric title="Realizados" value={metrics.realizados} hint="Listas fechadas" />
        <Metric title="Cancelados" value={metrics.cancelados} hint="Permanecem cancelados nas métricas" />
        <Metric
          title="Presença na escala"
          value={metrics.presenceRate == null ? "—" : `${metrics.presenceRate}%`}
          hint={`${metrics.presentes} presentes · ${metrics.extras} extras · ${metrics.atrasados} atrasados · ${metrics.ausentes} faltas · ${metrics.justificadas} justificadas`}
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
            {isAdmin(person) && pendencies ? <p>{pendencies.openIncidents} incidente(s) em aberto.</p> : null}
            <p>{todayOpen} atendimento(s) de hoje ainda sem lista fechada.</p>
            {metrics.highJustifications ? (
              <p className="text-destructive">Volume alto de justificativas no período — mesmo tipo de alerta que falta.</p>
            ) : null}
            {unread === 0 && pendingApprovals === 0 && todayOpen === 0 && !metrics.highJustifications ? (
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

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Eventos obrigatórios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {metrics.lastMeeting ? (
              <p>
                Última reunião · {metrics.lastMeeting.title}: {metrics.lastMeeting.presentes} presentes ·{" "}
                {metrics.lastMeeting.justificados} justificados
              </p>
            ) : (
              <p>Nenhuma reunião do Darpe encerrada.</p>
            )}
            {metrics.lastRehearsal ? (
              <p>
                Último ensaio · {metrics.lastRehearsal.title}: {metrics.lastRehearsal.presentes} presentes ·{" "}
                {metrics.lastRehearsal.justificados} justificados
              </p>
            ) : (
              <p>Nenhum ensaio encerrado.</p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Crescimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{metrics.newPeople} colaborador(es) cadastrado(s) no período.</p>
            <p>{metrics.newInstitutions} instituição(ões) nova(s) no período.</p>
          </CardContent>
        </Card>
        {pendencies ? (
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Capacidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {pendencies.capacityAlerts.length === 0 ? (
                <p>Nenhuma instituição próxima do limite nos próximos 10 dias.</p>
              ) : (
                pendencies.capacityAlerts.map((item) => (
                  <p key={item.id}>
                    {item.series.institution.name} · {formatDay(item.date)} · {item.scale.length}/
                    {item.series.institution.capacity}
                  </p>
                ))
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Agenda pessoal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Exporte os atendimentos e eventos da sua agenda para o calendário do aparelho.</p>
              <Button render={<Link href="/api/agenda/ics" />} variant="outline" size="sm">
                Baixar .ics
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {pendencies ? (
        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Escalas vazias (10 dias)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {pendencies.emptyScales.length === 0 ? (
                <p>Nenhuma escala vazia no horizonte de 10 dias.</p>
              ) : (
                pendencies.emptyScales.map((item) => (
                  <p key={item.id}>
                    {item.series.institution.name} · {formatDay(item.date)}
                  </p>
                ))
              )}
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Recadastramentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {pendencies.expiringLinks.length === 0 ? (
                <p>Nenhum vínculo vencendo nos próximos 30 dias.</p>
              ) : (
                pendencies.expiringLinks.map((link) => (
                  <p key={link.id}>
                    {link.person.name} · {link.institution.name}
                    {link.endAt ? ` · até ${formatDay(link.endAt)}` : ""}
                  </p>
                ))
              )}
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Checklists atrasados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {pendencies.delayedChecklists.length === 0 ? (
                <p>Nenhum item obrigatório pendente nos eventos à frente.</p>
              ) : (
                pendencies.delayedChecklists.map((item) => (
                  <p key={item.event.id}>
                    {item.event.title} · {item.pending.length} item(ns)
                  </p>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {pendencies ? (
        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Fotos em moderação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {pendencies.pendingPhotos.length === 0 ? (
                <p>Nenhum arquivo aguardando aprovação.</p>
              ) : (
                pendencies.pendingPhotos.map((item) => (
                  <p key={item.id}>
                    {item.series.institution.name} · {formatDay(item.date)}
                  </p>
                ))
              )}
              <Button render={<Link href="/app/admin/moderacao" />} variant="outline" size="sm">
                Abrir moderação
              </Button>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Documentos vencendo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {pendencies.expiringDocuments.length === 0 ? (
                <p>Nenhum documento vencendo nos próximos 30 dias.</p>
              ) : (
                pendencies.expiringDocuments.map((item) => (
                  <p key={item.id}>
                    {item.name}
                    {item.documentExpiresAt ? ` · até ${formatDay(item.documentExpiresAt)}` : ""}
                  </p>
                ))
              )}
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Pedidos LGPD</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                {pendencies.pendingLgpd === 0
                  ? "Nenhum pedido pendente."
                  : `${pendencies.pendingLgpd} pedido(s) aguardando a secretaria.`}
              </p>
              <Button render={<Link href="/app/admin/lgpd" />} variant="outline" size="sm">
                Abrir fila LGPD
              </Button>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {pendencies && pendencies.openIncidents > 0 ? (
        <p className="mb-8 text-sm text-muted-foreground">
          Há incidentes abertos.{" "}
          <Link className="underline-offset-4 hover:underline" href="/app/admin/incidentes">
            Abrir incidentes
          </Link>
        </p>
      ) : null}
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
