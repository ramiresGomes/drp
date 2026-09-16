import { createNotification } from "@/app/actions/admin";
import { AdminNav } from "@/components/admin-nav";
import { EmptyState, Flash } from "@/components/flash";
import { areaClass, controlClass, Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { AUDIENCE_LABELS, COMPETENCY_LABELS, ROLE_LABELS } from "@/lib/labels";
import { audienceCaption } from "@/lib/notifications";
import { formatDateTime } from "@/lib/dates";
import { requireAdmin } from "@/lib/session";

const AUDIENCE_OPTIONS = ["todos", "admin", "vinculados", "escalados", "papel", "competencia", "instituicao", "setor", "cidade"];

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const [notifications, institutions, sectors, cities] = await Promise.all([
    prisma.notification.findMany({
      include: { receipts: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.institution.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.sector.findMany({ orderBy: { code: "asc" } }),
    prisma.city.findMany({ orderBy: { name: "asc" } }),
  ]);
  const catalogs = { institutions, sectors, cities };

  return (
    <div>
      <AdminNav current="/app/admin/notificacoes" />
      <h1 className="mb-2 font-heading text-3xl">Avisos internos</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Só há canal interno. O público é congelado no momento do envio. Aviso agendado só chega na data marcada.
        Preferências não desligam aviso obrigatório.
      </p>
      <Flash erro={params.erro} ok={params.ok} />

      <Card className="mb-8 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Novo aviso</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createNotification} className="grid gap-3">
            <Field label="Título">
              <input className={controlClass} name="title" required />
            </Field>
            <Field label="Texto">
              <textarea className={areaClass} name="body" required />
            </Field>
            <Field label="Público">
              <select className={controlClass} name="audience" defaultValue="todos">
                {AUDIENCE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {AUDIENCE_LABELS[value]}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Função (se o público for por função)">
                <select className={controlClass} name="role">
                  <option value="">—</option>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Competência (se o público for por competência)">
                <select className={controlClass} name="competency">
                  <option value="">—</option>
                  {Object.entries(COMPETENCY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Instituição">
                <select className={controlClass} name="institutionId">
                  <option value="">—</option>
                  {institutions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Setor">
                <select className={controlClass} name="sectorId">
                  <option value="">—</option>
                  {sectors.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code}. {item.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Cidade">
                <select className={controlClass} name="cityId">
                  <option value="">—</option>
                  {cities.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Agendar (opcional)">
              <input className={controlClass} type="datetime-local" name="scheduledAt" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="mandatory" /> Aviso obrigatório
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="requiresAck" /> Exigir ciência
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="requiresConfirm" /> Exigir confirmação
            </label>
            <Button type="submit">Enviar ou agendar</Button>
          </form>
        </CardContent>
      </Card>

      {notifications.length === 0 ? (
        <EmptyState title="Nenhum aviso" description="Publique o primeiro comunicado da regional." />
      ) : (
        <div className="grid gap-3">
          {notifications.map((item) => (
            <div key={item.id} className="rounded-xl border border-border p-4">
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {audienceCaption(item.audience, item.audienceRef, catalogs)} · {formatDateTime(item.createdAt)}
                {item.scheduledAt && !item.sentAt ? ` · agendado para ${formatDateTime(item.scheduledAt)}` : ""}
                {item.sentAt ? ` · enviado ${formatDateTime(item.sentAt)}` : ""}
                {` · ${item.receipts.filter((receipt) => receipt.scienceAt).length} ciência · ${item.receipts.filter((receipt) => receipt.confirmedAt).length} confirmação`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
